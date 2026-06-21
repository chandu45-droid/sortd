/**
 * Core data model for the Financial Wellness App engine.
 * Pure types only — no logic, no platform deps. All money is integer paise.
 */

/** Integer number of paise (1 rupee = 100 paise). Branded to prevent mixing with raw numbers. */
export type Paise = number & { readonly __brand: 'Paise' };

/** The four diagnosis buckets — independent guardrails, NOT slices summing to 100%. */
export type Bucket = 'essentials' | 'discretionary' | 'debt' | 'investments';

/**
 * Manually-entered monthly expense categories.
 * Note: `habits` is intentionally NOT here — habit spend is derived from `Habit[]` and
 * added to the discretionary bucket exactly once (no double-count).
 */
export type ExpenseCategory =
  | 'rent'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'subscriptions'
  | 'entertainment'
  | 'misc'
  | 'emi';

/** A recurring habit, entered once; feeds the budget and powers projections. */
export interface Habit {
  name: string;
  /** Cost per single unit (e.g., per cigarette, per coffee). */
  costPerUnit: Paise;
  /** Units consumed per day (may be fractional, e.g., 0.5). */
  unitsPerDay: number;
}

/** One month's financial picture, as entered by the user. */
export interface FinancialInput {
  /** Net monthly income. */
  monthlyIncome: Paise;
  /** Per-category monthly spend. Omitted categories are treated as 0. */
  expenses: Partial<Record<ExpenseCategory, Paise>>;
  /** Habits — their combined monthly cost is added to the `discretionary` bucket once. */
  habits: Habit[];
  /** Total monthly amount actually invested (SIP / FD / PPF / RD contributions). */
  monthlyInvested: Paise;
}

/** Investment instruments the projector and goals understand. */
export type Instrument = 'savings' | 'fd' | 'rd' | 'ppf' | 'equity' | 'gold' | 'idle';

/** A conservative→expected annual return band, as decimals (0.07 = 7%). */
export interface RateBand {
  conservative: number;
  expected: number;
}

/** Whether a bucket benchmark is a ceiling (≤) or a floor (≥). */
export type BenchmarkDirection = 'ceiling' | 'floor';

/** A bucket's benchmark: a fraction of income plus its direction. */
export interface BucketBenchmark {
  bucket: Bucket;
  /** Fraction of income, e.g., 0.5 for 50%. */
  limit: number;
  direction: BenchmarkDirection;
}

/** How a bucket fared against its benchmark. */
export type BucketStatus = 'ok' | 'breached';

/** Per-bucket evaluation result. */
export interface BucketResult {
  bucket: Bucket;
  amount: Paise;
  /** Bucket amount as a fraction of income (0..1+). 0 when income is 0. */
  pctOfIncome: number;
  /** The benchmark limit (fraction of income). */
  benchmark: number;
  direction: BenchmarkDirection;
  status: BucketStatus;
  /** Points deducted from the health score for this bucket (0 when ok). */
  penalty: number;
}

/** Severity of a diagnosis flag. */
export type Severity = 'info' | 'caution' | 'warning';

/** A structured diagnosis finding. Human-facing copy is generated later by insights.ts. */
export interface Flag {
  bucket: Bucket;
  severity: Severity;
  pctOfIncome: number;
  benchmark: number;
  direction: BenchmarkDirection;
  /** Distance past the benchmark, in paise (how far over a ceiling / under a floor). */
  deltaToBenchmark: Paise;
}

/** The single evaluation result that powers the diagnosis screen, dashboard, and progress diff. */
export interface EvaluationResult {
  /** Health score, 0..100. */
  score: number;
  buckets: BucketResult[];
  flags: Flag[];
  /** income − total expenses − invested. May be negative (overspending). */
  idleCash: Paise;
  totals: {
    income: Paise;
    /** All expense categories + habits (excludes invested). */
    expenses: Paise;
    invested: Paise;
    byBucket: Record<Bucket, Paise>;
  };
}

// ---------------------------------------------------------------------------
// Statement Analysis — CC statement parsing + parent-voice observations
// ---------------------------------------------------------------------------

/** A single transaction parsed from a CC statement CSV. */
export interface Transaction {
  /** ISO date (YYYY-MM-DD), normalized from the bank's format. */
  date: string;
  /** Raw description/narration from the statement. */
  description: string;
  /** Spend amount in paise (always positive for debits). */
  amount: Paise;
  /** Auto-assigned category, or 'uncategorized' if no keyword matched. */
  category: ExpenseCategory | 'uncategorized';
  /** Cleaned merchant name extracted from the description. */
  merchant: string;
}

/** Spending breakdown for one category. */
export interface CategoryBreakdown {
  category: ExpenseCategory | 'uncategorized';
  total: Paise;
  count: number;
  /** Fraction of total CC spend (0..1). */
  pctOfTotal: number;
}

/** Pattern types the analyzer detects. */
export type ObservationType =
  | 'repeat-merchant'
  | 'category-heavy'
  | 'big-single'
  | 'subscription-creep'
  | 'micro-leak'
  | 'weekend-spike'
  | 'food-delivery'
  | 'daily-habit';

/** A single parent-voice observation about spending patterns. */
export interface Observation {
  type: ObservationType;
  severity: Severity;
  title: string;
  /** The warm, specific, parent-voice message. */
  message: string;
  /** Total amount involved in this observation, in paise. */
  amount: Paise;
  /** Estimated monthly savings if the user adjusts this behavior. */
  savingsPotential?: Paise;
}

/** High-level stats for the parsed statement. */
export interface StatementSummary {
  totalSpend: Paise;
  transactionCount: number;
  avgPerTransaction: Paise;
  dailyAvg: Paise;
  daysCovered: number;
  topCategory: ExpenseCategory | 'uncategorized';
  /** CC spend as fraction of income, if income was provided. */
  pctOfIncome?: number;
}

/** Full result of analyzing a CC statement. */
export interface StatementAnalysis {
  transactions: Transaction[];
  categories: CategoryBreakdown[];
  observations: Observation[];
  summary: StatementSummary;
}

// ---------------------------------------------------------------------------
// SMS Transaction Parsing — bank debit SMS → structured spend data
// ---------------------------------------------------------------------------

/** Raw SMS message as received from the device. */
export interface RawSMS {
  /** Sender address (e.g., "AD-HDFCBK", "VM-ICICIB"). */
  sender: string;
  /** Full SMS body text. */
  body: string;
  /** Timestamp when the SMS was received (epoch ms). */
  receivedAt: number;
}

/** A transaction extracted from a bank SMS. */
export interface SMSTransaction {
  /** ISO date (YYYY-MM-DD) extracted from the SMS, or derived from receivedAt. */
  date: string;
  /** Amount debited, in paise. */
  amount: Paise;
  /** Raw merchant/payee string as it appears in the SMS. */
  rawMerchant: string;
  /** Cleaned merchant name. */
  merchant: string;
  /** Auto-assigned category. */
  category: ExpenseCategory | 'uncategorized';
  /** Bank name extracted from sender or body. */
  bank: string;
  /** Payment channel detected (UPI, card, netbanking, etc.). */
  channel: SMSChannel;
  /** The original SMS body (for user reference). */
  originalSMS: string;
}

/** Payment channel types found in Indian bank SMS. */
export type SMSChannel = 'upi' | 'card' | 'netbanking' | 'neft' | 'imps' | 'pos' | 'atm' | 'unknown';

/** Parent-voice "necessity check" for a single transaction. */
export interface NecessityCheck {
  transaction: SMSTransaction;
  /** The parent-voice question about this specific spend. */
  question: string;
  /** Category-based necessity tag. */
  tag: NecessityTag;
}

/** How essential a spend likely is, based on category + amount heuristics. */
export type NecessityTag = 'essential' | 'maybe' | 'wants' | 'impulse';
