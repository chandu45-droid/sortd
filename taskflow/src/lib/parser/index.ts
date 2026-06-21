/**
 * Intent parser — main entry point.
 * Layer 1 (rules) handles ~80% of messages at zero cost.
 * Layer 2 (LLM) handles ambiguous messages at ~$0.0001/call.
 */
export type {
  ParsedIntent,
  Confidence,
  TaskCreateIntent,
  ExpenseLogIntent,
  TaskDoneIntent,
  TaskSkipIntent,
  QueryTasksIntent,
  QueryExpensesIntent,
  QuerySummaryIntent,
  SetProfileIntent,
  HelpIntent,
  UnknownIntent,
} from "./types";

export { parseWithRules } from "./rules";
export { parseWithLLM } from "./llm";
export { extractAmount, extractAllAmounts } from "./amount";
export {
  extractDate,
  extractPeriod,
  hasDateTimeSignal,
} from "./hinglish";

interface ParseOptions {
  llmEnabled?: boolean;
}

/**
 * Parse a WhatsApp message into a structured intent.
 * Tries Layer 1 (rules) first. If confidence is not "high" and LLM is enabled,
 * falls back to Layer 2 (Claude Haiku).
 */
export async function parse(
  message: string,
  options: ParseOptions = {}
): Promise<import("./types").ParsedIntent> {
  const { parseWithRules } = await import("./rules");
  const rulesResult = parseWithRules(message);

  if (rulesResult.confidence === "high" || !options.llmEnabled) {
    return rulesResult;
  }

  try {
    const { parseWithLLM } = await import("./llm");
    const llmResult = await parseWithLLM(message);
    return llmResult;
  } catch (err) {
    console.error("[parser] LLM fallback failed, using rules result:", err);
    return rulesResult;
  }
}
