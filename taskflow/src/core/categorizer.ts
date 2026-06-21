import type { ExpenseCategory, Transaction } from './types';

// ---------------------------------------------------------------------------
// Keyword rules — pattern → category + optional friendly label
// Order matters: first match wins. Put specific merchants before generic keywords.
// ---------------------------------------------------------------------------

interface CategoryRule {
  pattern: RegExp;
  category: ExpenseCategory;
  label?: string;
}

const RULES: readonly CategoryRule[] = [
  // ----- Food delivery / restaurants -----
  { pattern: /swiggy/i, category: 'food', label: 'Swiggy' },
  { pattern: /zomato/i, category: 'food', label: 'Zomato' },
  { pattern: /uber\s*eats/i, category: 'food', label: 'Uber Eats' },
  { pattern: /domino'?s|dominos/i, category: 'food', label: 'Dominos' },
  { pattern: /pizza\s*hut/i, category: 'food', label: 'Pizza Hut' },
  { pattern: /mcdonald'?s|mcdonalds/i, category: 'food', label: 'McDonalds' },
  { pattern: /burger\s*king/i, category: 'food', label: 'Burger King' },
  { pattern: /kfc/i, category: 'food', label: 'KFC' },
  { pattern: /starbucks/i, category: 'food', label: 'Starbucks' },
  { pattern: /chaayos/i, category: 'food', label: 'Chaayos' },
  { pattern: /haldiram/i, category: 'food', label: 'Haldirams' },
  { pattern: /barbeque\s*nation/i, category: 'food', label: 'Barbeque Nation' },
  { pattern: /subway/i, category: 'food', label: 'Subway' },
  { pattern: /dunkin/i, category: 'food', label: 'Dunkin' },
  { pattern: /cafe\s*coffee\s*day|ccd/i, category: 'food', label: 'CCD' },
  { pattern: /third\s*wave/i, category: 'food', label: 'Third Wave Coffee' },
  { pattern: /blue\s*tokai/i, category: 'food', label: 'Blue Tokai' },
  { pattern: /restaurant|cafe|dhaba|biryani|bakery|eatery|canteen|mess\b|tiffin|dine|diner/i, category: 'food' },
  { pattern: /\b(food|meal|lunch|dinner|breakfast|snack)\b/i, category: 'food' },
  { pattern: /grofers|blinkit|bigbasket|zepto|instamart|jiomart|dunzo/i, category: 'food', label: 'Groceries' },
  { pattern: /grocer|supermarket|provision|kirana|departmental/i, category: 'food' },
  { pattern: /fresh|vegetables|fruits|dairy|meat|fish/i, category: 'food' },

  // ----- Transport -----
  { pattern: /\buber\b(?!\s*eat)/i, category: 'transport', label: 'Uber' },
  { pattern: /\bola\b/i, category: 'transport', label: 'Ola' },
  { pattern: /rapido/i, category: 'transport', label: 'Rapido' },
  { pattern: /irctc|railway|train/i, category: 'transport', label: 'Railways' },
  { pattern: /redbus|abhibus/i, category: 'transport', label: 'Bus Travel' },
  { pattern: /makemytrip|mmt|goibibo|cleartrip|yatra/i, category: 'transport', label: 'Travel Booking' },
  { pattern: /indigo|spicejet|air\s*india|vistara|akasa|go\s*first/i, category: 'transport', label: 'Flight' },
  { pattern: /petrol|diesel|fuel|indian\s*oil|hp\s*fuel|bharat\s*petroleum|iocl|bpcl|hpcl/i, category: 'transport' },
  { pattern: /metro\s*card|metro\s*recharge|dmrc|bmrc|cmrl|hmrl/i, category: 'transport' },
  { pattern: /parking|toll|fastag|nhai/i, category: 'transport' },

  // ----- Subscriptions -----
  { pattern: /netflix/i, category: 'subscriptions', label: 'Netflix' },
  { pattern: /hotstar|disney\s*\+/i, category: 'subscriptions', label: 'Hotstar' },
  { pattern: /spotify/i, category: 'subscriptions', label: 'Spotify' },
  { pattern: /amazon\s*prime/i, category: 'subscriptions', label: 'Amazon Prime' },
  { pattern: /youtube\s*premium/i, category: 'subscriptions', label: 'YouTube Premium' },
  { pattern: /apple.*subscription|icloud/i, category: 'subscriptions', label: 'Apple' },
  { pattern: /zee5/i, category: 'subscriptions', label: 'Zee5' },
  { pattern: /sonyliv/i, category: 'subscriptions', label: 'SonyLIV' },
  { pattern: /jio\s*cinema/i, category: 'subscriptions', label: 'JioCinema' },
  { pattern: /audible/i, category: 'subscriptions', label: 'Audible' },
  { pattern: /chatgpt|openai/i, category: 'subscriptions', label: 'ChatGPT' },
  { pattern: /google\s*one/i, category: 'subscriptions', label: 'Google One' },
  { pattern: /subscription|recurring|membership|premium\s*plan/i, category: 'subscriptions' },

  // ----- Utilities -----
  { pattern: /electricity|bescom|tata\s*power|adani\s*elect|torrent\s*power|cesc/i, category: 'utilities' },
  { pattern: /\b(jio|airtel|vodafone|vi|bsnl)\b.*recharge/i, category: 'utilities' },
  { pattern: /\brecharge\b/i, category: 'utilities' },
  { pattern: /broadband|internet|wifi|act\s*fibernet|hathway/i, category: 'utilities' },
  { pattern: /water\s*bill|water\s*board|gas\s*bill|piped\s*gas|mahanagar\s*gas|indraprastha\s*gas/i, category: 'utilities' },
  { pattern: /\b(dth|tata\s*sky|dish\s*tv|d2h|sun\s*direct)\b/i, category: 'utilities' },

  // ----- Rent -----
  { pattern: /\b(rent|house\s*rent|flat\s*rent)\b/i, category: 'rent' },
  { pattern: /\b(society|maintenance|hoa|apartment\s*fee)\b/i, category: 'rent' },

  // ----- Entertainment -----
  { pattern: /pvr|inox|cinepolis|cinema|movie/i, category: 'entertainment' },
  { pattern: /book\s*my\s*show/i, category: 'entertainment', label: 'BookMyShow' },
  { pattern: /paytm\s*insider|insider\.in/i, category: 'entertainment' },
  { pattern: /steam|playstation|xbox|epic\s*games|riot/i, category: 'entertainment' },
  { pattern: /play\s*store|app\s*store|google\s*play/i, category: 'entertainment' },
  { pattern: /game|gaming|arcade|bowling|amusement/i, category: 'entertainment' },
  { pattern: /concert|event|ticket|theme\s*park|water\s*park/i, category: 'entertainment' },

  // ----- EMI / Loans -----
  { pattern: /\bemi\b/i, category: 'emi' },
  { pattern: /\bloan\b.*(?:repay|payment|instalment)/i, category: 'emi' },
  { pattern: /bajaj\s*finserv|hdfc\s*loan|icici\s*loan|tata\s*capital/i, category: 'emi' },

  // ----- Shopping / Misc (catch-all for known merchants) -----
  { pattern: /amazon(?!\s*prime)/i, category: 'misc', label: 'Amazon' },
  { pattern: /flipkart/i, category: 'misc', label: 'Flipkart' },
  { pattern: /myntra/i, category: 'misc', label: 'Myntra' },
  { pattern: /ajio/i, category: 'misc', label: 'Ajio' },
  { pattern: /meesho/i, category: 'misc', label: 'Meesho' },
  { pattern: /nykaa/i, category: 'misc', label: 'Nykaa' },
  { pattern: /croma/i, category: 'misc', label: 'Croma' },
  { pattern: /reliance\s*digital/i, category: 'misc', label: 'Reliance Digital' },
  { pattern: /decathlon/i, category: 'misc', label: 'Decathlon' },
  { pattern: /ikea/i, category: 'misc', label: 'IKEA' },
  { pattern: /pepperfry|urban\s*ladder/i, category: 'misc' },
  { pattern: /pharmeasy|netmeds|1mg|apollo\s*pharmacy|medplus/i, category: 'misc', label: 'Pharmacy' },
  { pattern: /hospital|clinic|doctor|dental|diagnostic|lab|pathology/i, category: 'misc', label: 'Medical' },
  { pattern: /gym|fitness|cult\.fit|cultfit/i, category: 'misc', label: 'Fitness' },
  { pattern: /salon|spa|parlour|parlor|grooming|urban\s*company|urbanclap/i, category: 'misc', label: 'Grooming' },
];

// ---------------------------------------------------------------------------
// Merchant name cleaning — strip noise from raw CC descriptions
// ---------------------------------------------------------------------------

export function cleanMerchant(description: string): string {
  return description
    .replace(/\b(pos|ecom|ib|neft|imps|upi|ref\s*no|txn\s*id|card\s*no|arn|auth\s*code)\b/gi, '')
    .replace(/\*+/g, ' ')
    .replace(/\b\d{6,}\b/g, '')         // long numbers (card/ref numbers)
    .replace(/\b\d{2}[\/\-]\d{2}[\/\-]\d{2,4}\b/g, '') // inline dates
    .replace(/[#:\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Categorize a single transaction
// ---------------------------------------------------------------------------

interface CategorizeResult {
  category: ExpenseCategory | 'uncategorized';
  merchant: string;
}

export function categorize(description: string): CategorizeResult {
  const cleaned = cleanMerchant(description);

  for (const rule of RULES) {
    if (rule.pattern.test(description) || rule.pattern.test(cleaned)) {
      return {
        category: rule.category,
        merchant: rule.label ?? cleaned,
      };
    }
  }

  return { category: 'uncategorized', merchant: cleaned };
}

// ---------------------------------------------------------------------------
// Categorize a batch of parsed rows into full Transactions
// ---------------------------------------------------------------------------
