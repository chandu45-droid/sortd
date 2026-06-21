/**
 * Amount parser — extracts rupee amounts from natural text.
 * Handles: 200, 200rs, rs200, ₹200, 2k, 2.5k, 15000, 1,500
 * All output is in paise (integer).
 */

interface AmountMatch {
  /** Amount in paise (integer) */
  paise: number;
  /** The original text that was matched */
  raw: string;
  /** Start index of the match in the original string */
  startIndex: number;
}

/**
 * Regex patterns for amount detection.
 * Order matters — most specific first.
 */
const AMOUNT_PATTERNS: RegExp[] = [
  // ₹200 or Rs200 or Rs.200 or rs 200 (with optional decimals)
  /(?:₹|rs\.?\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:k\b)?/gi,
  // 200rs or 200 rs or 200₹
  /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees?)\s*(?:k\b)?/gi,
  // 2.5k or 2k (with optional prefix ₹/Rs)
  /(?:₹|rs\.?\s*)?(\d+(?:\.\d{1,2})?)\s*k\b/gi,
  // Plain number (200, 1500, 1,500) — only if 2+ digits
  /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/g,
];

/**
 * Extract the first amount found in a message.
 * Returns null if no amount detected.
 */
export function extractAmount(message: string): AmountMatch | null {
  const normalized = message.toLowerCase().trim();

  // Try ₹/Rs prefixed amounts first (highest confidence)
  const prefixed = /(?:₹|rs\.?\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(k)?/i;
  const prefixMatch = prefixed.exec(normalized);
  if (prefixMatch) {
    const num = parseNumber(prefixMatch[1]);
    const multiplier = prefixMatch[2] ? 1000 : 1;
    return {
      paise: Math.round(num * multiplier * 100),
      raw: prefixMatch[0],
      startIndex: prefixMatch.index,
    };
  }

  // Try suffixed amounts (200rs)
  const suffixed = /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees?)/i;
  const suffixMatch = suffixed.exec(normalized);
  if (suffixMatch) {
    const num = parseNumber(suffixMatch[1]);
    return {
      paise: Math.round(num * 100),
      raw: suffixMatch[0],
      startIndex: suffixMatch.index,
    };
  }

  // Try "k" suffix (2k, 2.5k)
  const kPattern = /(\d+(?:\.\d{1,2})?)\s*k\b/i;
  const kMatch = kPattern.exec(normalized);
  if (kMatch) {
    const num = parseNumber(kMatch[1]);
    return {
      paise: Math.round(num * 1000 * 100),
      raw: kMatch[0],
      startIndex: kMatch.index,
    };
  }

  // Plain number — only if 2+ digits and looks like money
  const plainPattern = /\b(\d{2,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/;
  const plainMatch = plainPattern.exec(normalized);
  if (plainMatch) {
    const num = parseNumber(plainMatch[1]);
    // Skip numbers that look like time (1-12 followed by am/pm or : )
    const afterMatch = normalized.slice(
      plainMatch.index + plainMatch[0].length
    );
    if (/^\s*(?:am|pm|:|o'?clock)/i.test(afterMatch)) return null;
    // Skip very small numbers (likely not money)
    if (num < 10) return null;
    return {
      paise: Math.round(num * 100),
      raw: plainMatch[0],
      startIndex: plainMatch.index,
    };
  }

  return null;
}

/**
 * Extract ALL amounts from a message (for multi-expense messages like "200 uber 150 swiggy").
 */
export function extractAllAmounts(message: string): AmountMatch[] {
  const results: AmountMatch[] = [];
  const normalized = message.toLowerCase().trim();

  // Combined pattern that matches all amount forms
  const allPattern =
    /(?:₹|rs\.?\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(k)?|(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees?)|(\d+(?:\.\d{1,2})?)\s*k\b|\b(\d{2,3}(?:,\d{3})*(?:\.\d{1,2})?)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = allPattern.exec(normalized)) !== null) {
    let num: number;
    let multiplier = 1;

    if (match[1] !== undefined) {
      // ₹/Rs prefix
      num = parseNumber(match[1]);
      multiplier = match[2] ? 1000 : 1;
    } else if (match[3] !== undefined) {
      // Suffix (200rs)
      num = parseNumber(match[3]);
    } else if (match[4] !== undefined) {
      // k suffix
      num = parseNumber(match[4]);
      multiplier = 1000;
    } else if (match[5] !== undefined) {
      // Plain number
      num = parseNumber(match[5]);
      if (num < 10) continue;
      // Skip time-like numbers
      const after = normalized.slice(match.index + match[0].length);
      if (/^\s*(?:am|pm|:|o'?clock)/i.test(after)) continue;
    } else {
      continue;
    }

    results.push({
      paise: Math.round(num! * multiplier * 100),
      raw: match[0],
      startIndex: match.index,
    });
  }

  return results;
}

/** Strip commas and parse as float */
function parseNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

export type { AmountMatch };
