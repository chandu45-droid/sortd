/**
 * Integer-paise money math + ₹ formatting.
 * All money in the engine is integer paise to avoid floating-point drift.
 */
import type { Paise } from './types';

/** Brand an integer number of paise. Throws on non-integers (guards against float drift). */
export function paise(n: number): Paise {
  if (!Number.isInteger(n)) {
    throw new Error(`Paise must be an integer, got ${n}`);
  }
  return n as Paise;
}

/** Zero paise. */
export const ZERO_PAISE: Paise = 0 as Paise;

/** Convert rupees (possibly fractional) to integer paise, rounded to the nearest paise. */
export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(rupees * 100) as Paise;
}

/** Convert paise to a rupee number (may be fractional). Use only at display/IO edges. */
export function paiseToRupees(p: Paise): number {
  return p / 100;
}

/** Add two paise amounts. */
export function addPaise(a: Paise, b: Paise): Paise {
  return (a + b) as Paise;
}

/** Subtract b from a (result may be negative). */
export function subPaise(a: Paise, b: Paise): Paise {
  return (a - b) as Paise;
}

/** Sum a list of paise amounts (empty list → 0). */
export function sumPaise(values: readonly Paise[]): Paise {
  let total = 0;
  for (const v of values) total += v;
  return total as Paise;
}

/** Multiply a paise amount by a scalar factor, rounded to the nearest integer paise. */
export function scalePaise(p: Paise, factor: number): Paise {
  if (!Number.isFinite(factor)) {
    throw new Error(`Invalid factor: ${factor}`);
  }
  return Math.round(p * factor) as Paise;
}

/** Fraction of `part` over `whole` (0..1+). Returns 0 when `whole` is 0. */
export function fractionOf(part: Paise, whole: Paise): number {
  if (whole === 0) return 0;
  return part / whole;
}

/** Indian digit grouping for an integer string: "1234567" -> "12,34,567". */
function groupIndian(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

export interface FormatOptions {
  /** Force two decimals even when paise are zero. Default: show paise only when non-zero. */
  alwaysPaise?: boolean;
}

/** Format integer paise as ₹ with Indian grouping. 12345678 -> "₹1,23,456.78". */
export function formatINR(p: Paise, opts: FormatOptions = {}): string {
  const sign = p < 0 ? '-' : '';
  const abs = Math.abs(p);
  const rupees = Math.floor(abs / 100);
  const paisePart = abs % 100;
  const showPaise = opts.alwaysPaise || paisePart !== 0;
  const paiseStr = showPaise ? `.${String(paisePart).padStart(2, '0')}` : '';
  return `${sign}₹${groupIndian(String(rupees))}${paiseStr}`;
}

/** Compact Indian format for headlines: ₹6.9L, ₹1.2Cr, ₹3,000. */
export function formatINRCompact(p: Paise): string {
  const sign = p < 0 ? '-' : '';
  const absRupees = Math.abs(p) / 100;
  if (absRupees >= 1e7) return `${sign}₹${stripZeros(absRupees / 1e7)}Cr`;
  if (absRupees >= 1e5) return `${sign}₹${stripZeros(absRupees / 1e5)}L`;
  return formatINR(p);
}

/** Round to ≤2 decimals and strip trailing zeros: 6.90 -> "6.9", 1.00 -> "1". */
function stripZeros(n: number): string {
  return String(Math.round(n * 100) / 100);
}
