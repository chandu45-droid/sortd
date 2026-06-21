import type { SMSTransaction, NecessityCheck, NecessityTag, ExpenseCategory, Paise } from './types';
import { formatINR } from './money';
import { rupeesToPaise } from './money';

// ---------------------------------------------------------------------------
// Necessity tagging — heuristic classification of how essential a spend is
// ---------------------------------------------------------------------------

const ESSENTIAL_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set([
  'rent', 'utilities', 'emi',
]);

const MAYBE_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set([
  'food', 'transport',
]);

const WANTS_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set([
  'subscriptions', 'entertainment', 'misc',
]);

function tagNecessity(txn: SMSTransaction): NecessityTag {
  const cat = txn.category;

  if (cat !== 'uncategorized' && ESSENTIAL_CATEGORIES.has(cat)) return 'essential';
  if (cat !== 'uncategorized' && MAYBE_CATEGORIES.has(cat)) {
    if (txn.amount > rupeesToPaise(2000)) return 'maybe';
    return 'essential';
  }
  if (cat !== 'uncategorized' && WANTS_CATEGORIES.has(cat)) {
    if (txn.amount > rupeesToPaise(1000)) return 'impulse';
    return 'wants';
  }

  if (txn.amount > rupeesToPaise(5000)) return 'impulse';
  if (txn.amount > rupeesToPaise(1000)) return 'maybe';
  return 'wants';
}

// ---------------------------------------------------------------------------
// Parent-voice questions — warm, specific, per-transaction
// ---------------------------------------------------------------------------

const FOOD_DELIVERY_PATTERN = /swiggy|zomato|uber\s*eats/i;

function generateQuestion(txn: SMSTransaction, tag: NecessityTag): string {
  const amt = formatINR(txn.amount);
  const who = txn.merchant || txn.rawMerchant || 'somewhere';

  if (FOOD_DELIVERY_PATTERN.test(txn.rawMerchant) || FOOD_DELIVERY_PATTERN.test(txn.originalSMS)) {
    return pickFoodDeliveryQuestion(amt, who, txn);
  }

  if (tag === 'essential') {
    return pickEssentialQuestion(amt, who, txn);
  }

  if (tag === 'impulse') {
    return pickImpulseQuestion(amt, who, txn);
  }

  if (tag === 'wants') {
    return pickWantsQuestion(amt, who, txn);
  }

  return pickMaybeQuestion(amt, who, txn);
}

function pickEssentialQuestion(amt: string, who: string, txn: SMSTransaction): string {
  const pool = [
    `${amt} at ${who} — noted. Essentials we don't question, but are we getting the best rate?`,
    `${amt} for ${who}. This is a need, not a want — good. Just make sure there's no cheaper alternative.`,
    `${amt} to ${who}. Necessary expense. Filed.`,
  ];
  return pool[simpleHash(txn.originalSMS) % pool.length]!;
}

function pickFoodDeliveryQuestion(amt: string, who: string, txn: SMSTransaction): string {
  const pool = [
    `${amt} on ${who} again? Beta, there's a kitchen at home. What did you order that you couldn't cook?`,
    `${amt} at ${who}. How many times this week? I'm not judging... okay, I'm judging a little. Could you cook this?`,
    `${amt} to ${who}. Was this lunch? Dinner? A 2 AM craving? Be honest — would a homemade meal have worked?`,
    `${amt} on ${who}. That delivery fee alone could buy vegetables for two days. Was this truly needed?`,
  ];
  return pool[simpleHash(txn.originalSMS) % pool.length]!;
}

function pickImpulseQuestion(amt: string, who: string, txn: SMSTransaction): string {
  const pool = [
    `${amt} at ${who}?! That's a big number, beta. Did you think about this for at least 24 hours before buying?`,
    `${amt} to ${who}. I have one question: if you had to earn this amount again from scratch today, would you still spend it here?`,
    `${amt} at ${who}. This is the kind of spending that feels fine today but hurts at month-end. Was this planned?`,
    `${amt} on ${who}. Before you get defensive — I'm just asking: was this a need or did you just feel like it?`,
  ];
  return pool[simpleHash(txn.originalSMS) % pool.length]!;
}

function pickWantsQuestion(amt: string, who: string, txn: SMSTransaction): string {
  const pool = [
    `${amt} at ${who}. Not the end of the world, but — did this make you happy? Really happy? Or just "meh" happy?`,
    `${amt} to ${who}. Small spends add up. If you do this 10 times a month, that's ${formatINR((txn.amount * 10) as Paise)}. Think about it.`,
    `${amt} at ${who}. Was this something you needed today, or something you could have skipped without noticing?`,
  ];
  return pool[simpleHash(txn.originalSMS) % pool.length]!;
}

function pickMaybeQuestion(amt: string, who: string, txn: SMSTransaction): string {
  const pool = [
    `${amt} at ${who}. Could be necessary, could be avoidable — you tell me. Was there a cheaper way to do this?`,
    `${amt} to ${who}. I'm on the fence about this one. Needed, or just convenient?`,
    `${amt} at ${who}. Sometimes convenience costs more than it should. Was this one of those times?`,
  ];
  return pool[simpleHash(txn.originalSMS) % pool.length]!;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a necessity check for a single SMS transaction.
 * Returns the transaction with a parent-voice question and necessity tag.
 */
export function checkNecessity(txn: SMSTransaction): NecessityCheck {
  const tag = tagNecessity(txn);
  const question = generateQuestion(txn, tag);
  return { transaction: txn, question, tag };
}

/**
 * Generate necessity checks for a batch of transactions.
 */
export function checkNecessityBatch(txns: readonly SMSTransaction[]): NecessityCheck[] {
  return txns.map(checkNecessity);
}
