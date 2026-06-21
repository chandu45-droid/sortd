/**
 * Intent parser output types — discriminated union.
 * Every parsed message becomes one of these intents.
 */

export type ParsedIntent =
  | TaskCreateIntent
  | ExpenseLogIntent
  | TaskDoneIntent
  | TaskSkipIntent
  | QueryTasksIntent
  | QueryExpensesIntent
  | QuerySummaryIntent
  | SetProfileIntent
  | HelpIntent
  | UnknownIntent;

export interface TaskCreateIntent {
  intent: "task_create";
  title: string;
  dueAt: Date | null;
  remindAt: Date | null;
  category: string | null;
  confidence: Confidence;
}

export interface ExpenseLogIntent {
  intent: "expense_log";
  amountPaise: number;
  merchant: string | null;
  category: string;
  date: Date | null;
  confidence: Confidence;
}

export interface TaskDoneIntent {
  intent: "task_done";
  taskQuery: string;
  confidence: Confidence;
}

export interface TaskSkipIntent {
  intent: "task_skip";
  taskQuery: string;
  confidence: Confidence;
}

export interface QueryTasksIntent {
  intent: "query_tasks";
  filter: "today" | "overdue" | "all" | "pending";
  confidence: Confidence;
}

export interface QueryExpensesIntent {
  intent: "query_expenses";
  filter: "today" | "this_week" | "this_month";
  category: string | null;
  confidence: Confidence;
}

export interface QuerySummaryIntent {
  intent: "query_summary";
  period: "today" | "this_week" | "this_month";
  confidence: Confidence;
}

export interface SetProfileIntent {
  intent: "set_profile";
  field: string;
  value: string;
  confidence: Confidence;
}

export interface HelpIntent {
  intent: "help";
  confidence: Confidence;
}

export interface UnknownIntent {
  intent: "unknown";
  raw: string;
  confidence: Confidence;
}

export type Confidence = "high" | "medium" | "low";
