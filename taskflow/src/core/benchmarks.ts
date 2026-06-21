/**
 * The agreed financial benchmarks and constants. These are the canonical numbers;
 * every diagnosis flows from here. Validated against the design decisions.
 */
import type { Bucket, BucketBenchmark, ExpenseCategory, Instrument, RateBand } from './types';

/**
 * Bucket benchmarks — INDEPENDENT guardrails, not slices summing to 100%.
 * Three ceilings (don't exceed) and one floor (clear at least).
 */
export const BUCKET_BENCHMARKS: readonly BucketBenchmark[] = [
  { bucket: 'essentials', limit: 0.5, direction: 'ceiling' },
  { bucket: 'discretionary', limit: 0.3, direction: 'ceiling' },
  { bucket: 'debt', limit: 0.3, direction: 'ceiling' },
  { bucket: 'investments', limit: 0.2, direction: 'floor' },
];

/** Rent sub-rule: rent alone should stay within 20% of income — a guideline inside Essentials. */
export const RENT_SUBRULE_LIMIT = 0.2;

/** Which bucket each manually-entered expense category rolls up into. */
export const CATEGORY_TO_BUCKET: Record<ExpenseCategory, Bucket> = {
  rent: 'essentials',
  food: 'essentials',
  transport: 'essentials',
  utilities: 'essentials',
  subscriptions: 'discretionary',
  entertainment: 'discretionary',
  misc: 'discretionary',
  emi: 'debt',
};

/**
 * Max health-score penalty per bucket. Sums to 100 (worst case → score 0).
 * Debt is weighted highest (it's the most dangerous for this audience).
 */
export const BUCKET_MAX_PENALTY: Record<Bucket, number> = {
  debt: 30,
  investments: 25,
  essentials: 25,
  discretionary: 20,
};

/**
 * Conservative→expected annual return bands (decimals), illustrative historical India figures.
 * EDUCATIONAL ONLY — not advice; past performance does not guarantee future returns.
 */
export const INSTRUMENT_RATE_BANDS: Record<Instrument, RateBand> = {
  savings: { conservative: 0.03, expected: 0.04 },
  fd: { conservative: 0.065, expected: 0.07 },
  rd: { conservative: 0.06, expected: 0.065 },
  ppf: { conservative: 0.071, expected: 0.071 },
  equity: { conservative: 0.1, expected: 0.12 },
  gold: { conservative: 0.08, expected: 0.1 },
  idle: { conservative: 0, expected: 0 },
};
