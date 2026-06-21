/**
 * Hinglish time/date mappings and detection.
 * Maps Hindi/Hinglish words to English date/time concepts.
 */

// ---------------------------------------------------------------------------
// Date words -> offset from today
// ---------------------------------------------------------------------------

interface DateMapping {
  pattern: RegExp;
  /** Days offset from today (positive = future) */
  offsetDays: number;
}

const DATE_MAPPINGS: DateMapping[] = [
  { pattern: /\b(aaj|today)\b/i, offsetDays: 0 },
  { pattern: /\b(kal|tomorrow)\b/i, offsetDays: 1 },
  { pattern: /\b(parso|day\s*after\s*tomorrow)\b/i, offsetDays: 2 },
  { pattern: /\b(yesterday)\b/i, offsetDays: -1 },
];

// ---------------------------------------------------------------------------
// Time-of-day words -> default hour
// ---------------------------------------------------------------------------

interface TimeMapping {
  pattern: RegExp;
  /** Default hour (24h format) */
  hour: number;
  minute: number;
}

const TIME_MAPPINGS: TimeMapping[] = [
  { pattern: /\b(subah|morning)\b/i, hour: 7, minute: 0 },
  { pattern: /\b(dopahar|dopahr|afternoon)\b/i, hour: 13, minute: 0 },
  { pattern: /\b(shaam|evening)\b/i, hour: 18, minute: 0 },
  { pattern: /\b(raat|night)\b/i, hour: 21, minute: 0 },
];

// ---------------------------------------------------------------------------
// Day-of-week detection
// ---------------------------------------------------------------------------

const DAY_PATTERNS: { pattern: RegExp; dayIndex: number }[] = [
  { pattern: /\b(sunday|sun)\b/i, dayIndex: 0 },
  { pattern: /\b(monday|mon)\b/i, dayIndex: 1 },
  { pattern: /\b(tuesday|tue|tues)\b/i, dayIndex: 2 },
  { pattern: /\b(wednesday|wed)\b/i, dayIndex: 3 },
  { pattern: /\b(thursday|thu|thurs)\b/i, dayIndex: 4 },
  { pattern: /\b(friday|fri)\b/i, dayIndex: 5 },
  { pattern: /\b(saturday|sat)\b/i, dayIndex: 6 },
];

// ---------------------------------------------------------------------------
// Explicit time pattern (6pm, 6:30pm, 18:00, 6 pm)
// ---------------------------------------------------------------------------

const EXPLICIT_TIME = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;

// ---------------------------------------------------------------------------
// Period words (for queries: hafta, mahina)
// ---------------------------------------------------------------------------

export type TimePeriod = "today" | "this_week" | "this_month";

const PERIOD_MAPPINGS: { pattern: RegExp; period: TimePeriod }[] = [
  { pattern: /\b(aaj|today)\b/i, period: "today" },
  { pattern: /\b(hafta|week|is\s*hafte|this\s*week)\b/i, period: "this_week" },
  { pattern: /\b(mahina|month|is\s*mahine|this\s*month)\b/i, period: "this_month" },
];

// ---------------------------------------------------------------------------
// Exported regex constants
// ---------------------------------------------------------------------------

export const EXPENSE_KEYWORDS =
  /\b(spent|paid|expense|kharcha|kharach|bill|cost|lagaa|laga|diya|diye|kharch)\b/i;

export const DONE_PATTERNS =
  /\b(done|finished|completed|complete|ho\s*gaya|ho\s*gya|kar\s*diya|kar\s*liya|hogaya|hogya|kardiya|karliya)\b/i;

export const SKIP_PATTERNS =
  /\b(skip|cancel|nahi|mat|chhod|chod|cancel\s*kar|skip\s*kar|hatao|hata\s*do)\b/i;

export const QUERY_PATTERNS =
  /\b(what|how\s*much|kitna|list|show|dikhao|batao|kya|pending|left|overdue|remaining)\b/i;

export const HELP_PATTERNS =
  /^(help|h|start|\?|hi|hello|hey|hii|kya\s*kar\s*sakte\s*ho|what\s*can\s*you\s*do)$/i;

export const PROFILE_NAME_PATTERN =
  /\b(?:call\s*me|my\s*name\s*is|mera\s*naam|naam)\s+(.+)/i;

export const PROFILE_INCOME_PATTERN =
  /\b(?:i\s*earn|income|salary|kamaata|kamata)\s*(?:is\s*)?(?:[₹]|rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(k|lakh|lac|lpa)?\b/i;

export const PROFILE_BRIEF_PATTERN =
  /\b(?:morning\s*brief|brief)\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Extract a date from a message using Hinglish + English patterns.
 * Returns null if no date-like pattern found.
 */
export function extractDate(message: string, now: Date = new Date()): Date | null {
  // Check explicit day of week first
  for (const { pattern, dayIndex } of DAY_PATTERNS) {
    if (pattern.test(message)) {
      const date = getNextDayOfWeek(dayIndex, now);
      const time = extractTimeComponent(message);
      if (time) {
        date.setHours(time.hour, time.minute, 0, 0);
      }
      return date;
    }
  }

  // Check relative date words (aaj, kal, parso, etc.)
  for (const { pattern, offsetDays } of DATE_MAPPINGS) {
    if (pattern.test(message)) {
      const date = new Date(now);
      date.setDate(date.getDate() + offsetDays);
      const time = extractTimeComponent(message);
      if (time) {
        date.setHours(time.hour, time.minute, 0, 0);
      }
      return date;
    }
  }

  // Check if message has ONLY a time (no date) -- assume today
  const time = extractTimeComponent(message);
  if (time) {
    const date = new Date(now);
    date.setHours(time.hour, time.minute, 0, 0);
    if (date <= now) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  return null;
}

/**
 * Extract time period for queries (today, this_week, this_month).
 */
export function extractPeriod(message: string): TimePeriod {
  for (const { pattern, period } of PERIOD_MAPPINGS) {
    if (pattern.test(message)) return period;
  }
  return "today";
}

/**
 * Check if message contains any date/time indicator.
 */
export function hasDateTimeSignal(message: string): boolean {
  if (EXPLICIT_TIME.test(message)) return true;
  for (const { pattern } of DATE_MAPPINGS) {
    if (pattern.test(message)) return true;
  }
  for (const { pattern } of TIME_MAPPINGS) {
    if (pattern.test(message)) return true;
  }
  for (const { pattern } of DAY_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTimeComponent(
  message: string
): { hour: number; minute: number } | null {
  const explicitMatch = EXPLICIT_TIME.exec(message);
  if (explicitMatch) {
    let hour = parseInt(explicitMatch[1], 10);
    const minute = explicitMatch[2] ? parseInt(explicitMatch[2], 10) : 0;
    const ampm = explicitMatch[3]?.toLowerCase();

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  for (const { pattern, hour, minute } of TIME_MAPPINGS) {
    if (pattern.test(message)) return { hour, minute };
  }

  return null;
}

function getNextDayOfWeek(targetDay: number, now: Date): Date {
  const date = new Date(now);
  const currentDay = date.getDay();
  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) daysAhead += 7;
  date.setDate(date.getDate() + daysAhead);
  return date;
}
