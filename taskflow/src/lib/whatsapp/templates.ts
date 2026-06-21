/**
 * WhatsApp template message builders.
 * Each function returns the template name + components for sendTemplateMessage().
 *
 * Template messages cost Rs 0.115 each (utility category).
 * These must be pre-approved in Meta Business Manager.
 */
import type { TemplateComponent } from "./client";

interface TemplateConfig {
  name: string;
  components: TemplateComponent[];
}

/**
 * Morning brief — daily summary of tasks + yesterday's spend.
 * Template variables: {{1}} = brief text body
 */
export function morningBrief(briefText: string): TemplateConfig {
  return {
    name: "morning_brief",
    components: [
      {
        type: "body",
        parameters: [{ type: "text", text: briefText }],
      },
    ],
  };
}

/**
 * Task reminder — sent before a task deadline.
 * Template variables: {{1}} = task title, {{2}} = time until due
 */
export function taskReminder(
  taskTitle: string,
  timeUntilDue: string
): TemplateConfig {
  return {
    name: "task_reminder",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: taskTitle },
          { type: "text", text: timeUntilDue },
        ],
      },
    ],
  };
}

/**
 * Overdue nudge — daily list of overdue tasks.
 * Template variables: {{1}} = overdue tasks text
 */
export function overdueNudge(overdueText: string): TemplateConfig {
  return {
    name: "overdue_nudge",
    components: [
      {
        type: "body",
        parameters: [{ type: "text", text: overdueText }],
      },
    ],
  };
}

/**
 * Magic link — login URL for web dashboard.
 * Template variables: {{1}} = login URL
 */
export function magicLink(loginUrl: string): TemplateConfig {
  return {
    name: "magic_link",
    components: [
      {
        type: "body",
        parameters: [{ type: "text", text: loginUrl }],
      },
    ],
  };
}
