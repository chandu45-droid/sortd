/**
 * Habit cost math. A habit is entered once; its monthly cost feeds the budget
 * (discretionary bucket) exactly once — no double-count.
 * Long-horizon projections + "cut from X to Y" what-ifs are added alongside the projector.
 */
import type { Habit, Paise } from './types';
import { scalePaise, sumPaise } from './money';

/** Days per month for habit cost — matches the app's ₹/day → ₹/month convention (₹20×5/day = ₹3,000). */
export const DAYS_PER_MONTH = 30;

/** Monthly cost of a single habit: costPerUnit × unitsPerDay × 30, rounded to paise. */
export function habitMonthlyCost(habit: Habit): Paise {
  return scalePaise(habit.costPerUnit, habit.unitsPerDay * DAYS_PER_MONTH);
}

/** Combined monthly cost of all habits (empty list → 0). */
export function habitsMonthlyTotal(habits: readonly Habit[]): Paise {
  return sumPaise(habits.map(habitMonthlyCost));
}
