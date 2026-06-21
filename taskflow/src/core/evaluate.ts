/**
 * The keystone engine function: turns one month's FinancialInput into the single
 * EvaluationResult that powers the diagnosis screen, the dashboard score, and the
 * progress diff. The health score is transparent and benchmark-based: start at 100,
 * deduct a penalty per breached bucket proportional to how far past the line it is.
 */
import type {
  FinancialInput,
  EvaluationResult,
  Bucket,
  BucketBenchmark,
  BucketResult,
  BucketStatus,
  ExpenseCategory,
  Flag,
  Severity,
  Paise,
} from './types';
import { paise, addPaise, subPaise, sumPaise, fractionOf } from './money';
import { BUCKET_BENCHMARKS, CATEGORY_TO_BUCKET, BUCKET_MAX_PENALTY } from './benchmarks';
import { habitsMonthlyTotal } from './habits';

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

interface BucketScore {
  status: BucketStatus;
  penalty: number;
  deltaToBenchmark: Paise;
}

/** Score one bucket vs its benchmark. Penalty ∈ [0, maxPenalty]; delta is how far past the line. */
function scoreBucket(bm: BucketBenchmark, amount: Paise, pct: number, income: Paise): BucketScore {
  // Without income we can't evaluate ratios — treat as ok (the UI gates on income input).
  if (income <= 0) {
    return { status: 'ok', penalty: 0, deltaToBenchmark: paise(0) };
  }
  const maxPenalty = BUCKET_MAX_PENALTY[bm.bucket];
  const benchmarkAmount = paise(Math.round(bm.limit * income));

  if (bm.direction === 'ceiling') {
    if (pct <= bm.limit) return { status: 'ok', penalty: 0, deltaToBenchmark: paise(0) };
    // At the limit → 0; at 2× the limit (or beyond) → full penalty.
    const severity = clamp01((pct - bm.limit) / bm.limit);
    return { status: 'breached', penalty: maxPenalty * severity, deltaToBenchmark: subPaise(amount, benchmarkAmount) };
  }

  // floor
  if (pct >= bm.limit) return { status: 'ok', penalty: 0, deltaToBenchmark: paise(0) };
  // At the floor → 0; at 0 → full penalty.
  const severity = clamp01((bm.limit - pct) / bm.limit);
  return { status: 'breached', penalty: maxPenalty * severity, deltaToBenchmark: subPaise(benchmarkAmount, amount) };
}

function severityFor(penalty: number, bucket: Bucket): Severity {
  const frac = penalty / BUCKET_MAX_PENALTY[bucket];
  if (frac >= 0.66) return 'warning';
  if (frac >= 0.33) return 'caution';
  return 'info';
}

/** Diagnose one month's finances. Pure, deterministic, no side effects. */
export function evaluate(input: FinancialInput): EvaluationResult {
  const income = input.monthlyIncome;

  const byBucket: Record<Bucket, Paise> = {
    essentials: paise(0),
    discretionary: paise(0),
    debt: paise(0),
    investments: paise(0),
  };

  // Roll up manually-entered expense categories into their buckets.
  for (const key of Object.keys(input.expenses) as ExpenseCategory[]) {
    const amount = input.expenses[key];
    if (amount === undefined) continue;
    const bucket = CATEGORY_TO_BUCKET[key];
    byBucket[bucket] = addPaise(byBucket[bucket], amount);
  }

  // Habits feed discretionary exactly once.
  byBucket.discretionary = addPaise(byBucket.discretionary, habitsMonthlyTotal(input.habits));
  // Investments bucket is the explicitly-invested amount.
  byBucket.investments = addPaise(byBucket.investments, input.monthlyInvested);

  const expensesTotal = sumPaise([byBucket.essentials, byBucket.discretionary, byBucket.debt]);
  const idleCash = subPaise(subPaise(income, expensesTotal), input.monthlyInvested);

  const buckets: BucketResult[] = [];
  const flags: Flag[] = [];
  let totalPenalty = 0;

  for (const bm of BUCKET_BENCHMARKS) {
    const amount = byBucket[bm.bucket];
    const pct = fractionOf(amount, income);
    const s = scoreBucket(bm, amount, pct, income);
    totalPenalty += s.penalty;

    buckets.push({
      bucket: bm.bucket,
      amount,
      pctOfIncome: pct,
      benchmark: bm.limit,
      direction: bm.direction,
      status: s.status,
      penalty: s.penalty,
    });

    if (s.status === 'breached') {
      flags.push({
        bucket: bm.bucket,
        severity: severityFor(s.penalty, bm.bucket),
        pctOfIncome: pct,
        benchmark: bm.limit,
        direction: bm.direction,
        deltaToBenchmark: s.deltaToBenchmark,
      });
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  return {
    score,
    buckets,
    flags,
    idleCash,
    totals: {
      income,
      expenses: expensesTotal,
      invested: input.monthlyInvested,
      byBucket,
    },
  };
}
