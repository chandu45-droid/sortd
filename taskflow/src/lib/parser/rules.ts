/**
 * Layer 1: Rule-based intent parser.
 * Handles ~80% of messages with zero cost, ~1ms latency.
 */
import type { ParsedIntent, Confidence } from "./types";
import { extractAmount } from "./amount";
import {
  extractDate,
  extractPeriod,
  hasDateTimeSignal,
  EXPENSE_KEYWORDS,
  DONE_PATTERNS,
  SKIP_PATTERNS,
  QUERY_PATTERNS,
  HELP_PATTERNS,
  PROFILE_NAME_PATTERN,
  PROFILE_INCOME_PATTERN,
  PROFILE_BRIEF_PATTERN,
} from "./hinglish";
import { categorize } from "../../core/categorizer";

const CATEGORY_KEYWORDS: { pattern: RegExp; category: string }[] = [
  { pattern: /\b(food|chai|coffee|lunch|dinner|breakfast|biryani|snack|meal|tiffin)\b/i, category: "food" },
  { pattern: /\b(auto|cab|petrol|diesel|metro|bus|train|flight|uber|ola|rapido)\b/i, category: "transport" },
  { pattern: /\b(rent|maintenance|society)\b/i, category: "rent" },
  { pattern: /\b(emi|loan)\b/i, category: "emi" },
  { pattern: /\b(wifi|electricity|gas|water|recharge|broadband|bill)\b/i, category: "utilities" },
  { pattern: /\b(movie|drinks|party|cinema|pvr|concert|game|gaming)\b/i, category: "entertainment" },
  { pattern: /\b(clothes|shoes|shopping|shirt|jeans|kurta)\b/i, category: "misc" },
  { pattern: /\b(medicine|doctor|hospital|pharmacy|medical)\b/i, category: "misc" },
  { pattern: /\b(gym|fitness|yoga)\b/i, category: "misc" },
];

const KNOWN_MERCHANTS =
  /\b(swiggy|zomato|uber|ola|rapido|netflix|hotstar|amazon|flipkart|myntra|bigbasket|blinkit|zepto|dunzo|croma|nykaa|meesho|ajio|dominos|pizza\s*hut|mcdonalds|kfc|starbucks|subway|burger\s*king|chaayos|spotify|jiocinema|sonyliv|zee5)\b/i;

const EXPENSE_QUERY_SIGNALS =
  /\b(spend|spent|kharcha|expense|paisa|paise|money|rs|rupee|cost|kitna\s*laga|kitna\s*kharcha)\b/i;

const TASK_QUERY_SIGNALS =
  /\b(task|pending|left|overdue|remaining|kaam|baaki|baki|todo|to-do)\b/i;

const SUMMARY_SIGNALS =
  /\b(summary|summari|overview|how\s*am\s*i|kaisa\s*chal|overall|wrap|recap)\b/i;

const OVERDUE_SIGNALS = /\b(overdue|late|miss|missed|bhool|bhul)\b/i;

export function parseWithRules(message: string): ParsedIntent {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;

  // 1. Help
  if (HELP_PATTERNS.test(trimmed)) {
    return { intent: "help", confidence: "high" };
  }

  // 2. Profile
  const profileResult = parseProfile(trimmed);
  if (profileResult) return profileResult;

  // 3. Expense signals
  const amount = extractAmount(trimmed);
  const hasExpenseKeyword = EXPENSE_KEYWORDS.test(lower);
  const merchantMatch = KNOWN_MERCHANTS.exec(lower);
  const categoryMatch = matchCategory(lower);

  if (amount) {
    const hasExpenseSignal = hasExpenseKeyword || !!merchantMatch || !!categoryMatch;

    if (hasExpenseSignal) {
      const cat = merchantMatch
        ? categorize(merchantMatch[0])
        : categoryMatch
          ? { category: categoryMatch, merchant: null }
          : { category: "misc" as const, merchant: null };

      return {
        intent: "expense_log",
        amountPaise: amount.paise,
        merchant: merchantMatch?.[0] ?? cat.merchant ?? null,
        category: typeof cat.category === "string" ? cat.category : "misc",
        date: extractDate(trimmed) ?? new Date(),
        confidence: "high",
      };
    }

    // Short message with amount but no clear signal -> likely expense
    if (wordCount <= 4) {
      const remaining = trimmed
        .replace(amount.raw, "")
        .replace(/[₹rs\.]/gi, "")
        .trim();

      if (remaining) {
        const catResult = categorize(remaining);
        const catKeyword = matchCategory(remaining.toLowerCase());
        const category = catResult.category !== "uncategorized"
          ? catResult.category
          : catKeyword ?? "misc";

        return {
          intent: "expense_log",
          amountPaise: amount.paise,
          merchant: catResult.category !== "uncategorized" ? catResult.merchant : null,
          category,
          date: new Date(),
          confidence: "medium",
        };
      }

      return { intent: "unknown", raw: trimmed, confidence: "low" };
    }
  }

  // 4. Done patterns
  if (DONE_PATTERNS.test(lower)) {
    const taskQuery = extractTaskReference(trimmed, DONE_PATTERNS);
    return {
      intent: "task_done",
      taskQuery,
      confidence: taskQuery ? "high" : "medium",
    };
  }

  // 5. Skip patterns
  if (SKIP_PATTERNS.test(lower)) {
    const taskQuery = extractTaskReference(trimmed, SKIP_PATTERNS);
    return {
      intent: "task_skip",
      taskQuery,
      confidence: taskQuery ? "high" : "medium",
    };
  }

  // 6. Queries
  if (QUERY_PATTERNS.test(lower) || SUMMARY_SIGNALS.test(lower)) {
    if (SUMMARY_SIGNALS.test(lower)) {
      return {
        intent: "query_summary",
        period: extractPeriod(trimmed),
        confidence: "high",
      };
    }
    if (EXPENSE_QUERY_SIGNALS.test(lower)) {
      return {
        intent: "query_expenses",
        filter: extractPeriod(trimmed),
        category: matchCategory(lower),
        confidence: "high",
      };
    }
    if (TASK_QUERY_SIGNALS.test(lower) || OVERDUE_SIGNALS.test(lower)) {
      const filter = OVERDUE_SIGNALS.test(lower) ? "overdue" as const : "pending" as const;
      return { intent: "query_tasks", filter, confidence: "high" };
    }
    return { intent: "query_tasks", filter: "today", confidence: "medium" };
  }

  // 7. Expense keyword without amount
  if (hasExpenseKeyword && !amount) {
    return { intent: "unknown", raw: trimmed, confidence: "low" };
  }

  // 8. Task with date/time signal
  if (hasDateTimeSignal(trimmed)) {
    const dueAt = extractDate(trimmed);
    const title = cleanTaskTitle(trimmed);
    return {
      intent: "task_create",
      title,
      dueAt,
      remindAt: dueAt ? new Date(dueAt.getTime() - 30 * 60 * 1000) : null,
      category: null,
      confidence: "high",
    };
  }

  // 9. Short message -> task
  if (wordCount <= 8 && wordCount >= 1) {
    return {
      intent: "task_create",
      title: trimmed,
      dueAt: null,
      remindAt: null,
      category: null,
      confidence: "medium",
    };
  }

  return { intent: "unknown", raw: trimmed, confidence: "low" };
}

function parseProfile(message: string): ParsedIntent | null {
  const nameMatch = PROFILE_NAME_PATTERN.exec(message);
  if (nameMatch) {
    return {
      intent: "set_profile",
      field: "name",
      value: nameMatch[1].trim(),
      confidence: "high",
    };
  }

  const incomeMatch = PROFILE_INCOME_PATTERN.exec(message);
  if (incomeMatch) {
    let amount = parseFloat(incomeMatch[1].replace(/,/g, ""));
    const unit = incomeMatch[2]?.toLowerCase();
    if (unit === "k") amount *= 1000;
    if (unit === "lakh" || unit === "lac") amount *= 100000;
    if (unit === "lpa") amount *= 100000;
    return {
      intent: "set_profile",
      field: "income",
      value: String(Math.round(amount * 100)),
      confidence: "high",
    };
  }

  const briefMatch = PROFILE_BRIEF_PATTERN.exec(message);
  if (briefMatch) {
    let hour = parseInt(briefMatch[1], 10);
    const minute = briefMatch[2] ? parseInt(briefMatch[2], 10) : 0;
    const ampm = briefMatch[3]?.toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return {
      intent: "set_profile",
      field: "brief_time",
      value: hh + ":" + mm,
      confidence: "high",
    };
  }

  return null;
}

function matchCategory(text: string): string | null {
  for (const { pattern, category } of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function extractTaskReference(message: string, actionPattern: RegExp): string {
  return message
    .replace(actionPattern, "")
    .replace(/\b(with|the|my|mera|ka|ki|ke)\b/gi, "")
    .trim();
}

function cleanTaskTitle(message: string): string {
  return message
    .replace(/\b(at|by|on|before|kal|aaj|parso|tomorrow|today)\b/gi, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
    .replace(/\b(subah|dopahar|shaam|raat|morning|afternoon|evening|night)\b/gi, "")
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type { Confidence };
