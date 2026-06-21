/**
 * Layer 2: Claude Haiku LLM fallback.
 * Handles ambiguous messages that Layer 1 can't confidently parse.
 * Cost: ~$0.0001 per call (50 input + 30 output tokens).
 */
import type { ParsedIntent } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-20250514";

const SYSTEM_PROMPT = `You are a WhatsApp assistant message parser for an Indian user. Parse the user message and respond ONLY with a JSON object.

Valid intents: task_create, expense_log, task_done, task_skip, query_tasks, query_expenses, query_summary, set_profile, help, unknown

Output schema (include only relevant fields):
{
  "intent": "string",
  "title": "string (for tasks)",
  "due_at": "ISO date string or null",
  "amount_paise": "number (amount in paise, e.g. 200 rupees = 20000)",
  "merchant": "string or null",
  "category": "string (food/transport/rent/emi/utilities/entertainment/subscriptions/misc)",
  "task_query": "string (for done/skip — which task)",
  "filter": "string (today/this_week/this_month/overdue/pending)",
  "field": "string (for set_profile — name/income/brief_time)",
  "value": "string (for set_profile)"
}

Hinglish rules:
- kal = tomorrow, aaj = today, parso = day after tomorrow
- subah = morning (7am), dopahar = afternoon (1pm), shaam = evening (6pm), raat = night (9pm)
- kharcha/kharach = expense/spending
- kaam = task/work, baaki = remaining/pending
- ho gaya / kar diya = done/completed
- nahi / mat / skip = skip/cancel

Always respond with valid JSON only. No explanation, no markdown.`;

export async function parseWithLLM(message: string): Promise<ParsedIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[parser/llm] ANTHROPIC_API_KEY not set");
    return { intent: "unknown", raw: message, confidence: "low" };
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      console.error("[parser/llm] API error:", response.status, await response.text());
      return { intent: "unknown", raw: message, confidence: "low" };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      return { intent: "unknown", raw: message, confidence: "low" };
    }

    const llm = JSON.parse(text);
    return mapLLMResponse(llm, message);
  } catch (err) {
    console.error("[parser/llm] Failed:", err);
    return { intent: "unknown", raw: message, confidence: "low" };
  }
}

function mapLLMResponse(llm: Record<string, unknown>, raw: string): ParsedIntent {
  const intent = llm.intent as string;

  switch (intent) {
    case "task_create":
      return {
        intent: "task_create",
        title: (llm.title as string) ?? raw,
        dueAt: llm.due_at ? new Date(llm.due_at as string) : null,
        remindAt: llm.due_at
          ? new Date(new Date(llm.due_at as string).getTime() - 30 * 60 * 1000)
          : null,
        category: (llm.category as string) ?? null,
        confidence: "high",
      };

    case "expense_log":
      return {
        intent: "expense_log",
        amountPaise: (llm.amount_paise as number) ?? 0,
        merchant: (llm.merchant as string) ?? null,
        category: (llm.category as string) ?? "misc",
        date: new Date(),
        confidence: "high",
      };

    case "task_done":
      return {
        intent: "task_done",
        taskQuery: (llm.task_query as string) ?? raw,
        confidence: "high",
      };

    case "task_skip":
      return {
        intent: "task_skip",
        taskQuery: (llm.task_query as string) ?? raw,
        confidence: "high",
      };

    case "query_tasks":
      return {
        intent: "query_tasks",
        filter: ((llm.filter as string) ?? "today") as "today" | "overdue" | "all" | "pending",
        confidence: "high",
      };

    case "query_expenses":
      return {
        intent: "query_expenses",
        filter: ((llm.filter as string) ?? "today") as "today" | "this_week" | "this_month",
        category: (llm.category as string) ?? null,
        confidence: "high",
      };

    case "query_summary":
      return {
        intent: "query_summary",
        period: ((llm.filter as string) ?? "this_week") as "today" | "this_week" | "this_month",
        confidence: "high",
      };

    case "set_profile":
      return {
        intent: "set_profile",
        field: (llm.field as string) ?? "name",
        value: (llm.value as string) ?? "",
        confidence: "high",
      };

    case "help":
      return { intent: "help", confidence: "high" };

    default:
      return { intent: "unknown", raw, confidence: "low" };
  }
}
