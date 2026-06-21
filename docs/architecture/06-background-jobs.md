# Background Jobs

Proactive messaging is what makes this a personal assistant, not just a passive tool. These jobs run on schedule and push messages to users without being asked.

## Job Runner: Vercel Cron

V1 uses Vercel Cron (free tier: 2 cron jobs, daily minimum). If we need more granularity or more jobs, upgrade to Trigger.dev.

**Why Vercel Cron for V1:**
- Zero infra to manage
- Runs as Next.js API routes (same codebase)
- Free tier covers our 2 daily jobs
- Easy to migrate to Trigger.dev later if needed

## Job List

| Job | Schedule | What it does | Template message cost |
|---|---|---|---|
| Morning Brief | Daily, per-user configured time | Send today tasks + yesterday spend summary | $0.115 per user per day |
| Task Reminders | Every 15 min | Check for tasks with remind_at in next 15 min, send reminder | $0.115 per reminder |
| Overdue Nudge | Daily 8 PM IST | Send list of overdue tasks | $0.115 per user with overdue tasks |
| Session Cleanup | Daily midnight | Delete expired web_sessions tokens | $0 (internal only) |

## Job Details

### 1. Morning Brief

**Route:** /api/cron/morning-brief
**Schedule:** Runs every hour. Each run processes users whose morning_brief_time falls in that hour.

**Logic:**
1. Query users WHERE morning_brief_time BETWEEN current_hour AND current_hour + 59 min
2. For each user, build brief:
   - Pending tasks for today (sorted by due time)
   - Overdue tasks from previous days
   - Yesterday total spend by category
   - Current month running total vs last month
3. Send via WhatsApp template message (morning_brief)
4. Log send status

**Example morning brief message:**

> Good morning! Here is your day:
>
> *Tasks:*
> 1. gym -- 6:00 AM
> 2. call dentist
> 3. submit report -- 5:00 PM
> (1 overdue from yesterday)
>
> *Yesterday spend:* Rs.850 (Food Rs.450, Transport Rs.200, Other Rs.200)
> *This month so far:* Rs.12,400

**Cost at scale:**
- 100 users: $11.50/day = $345/month
- 1000 users: $115/day = $3,450/month
- This is the most expensive background job. Consider making it opt-in or Pro-only at scale.

### 2. Task Reminders

**Route:** /api/cron/task-reminders
**Schedule:** Every 15 minutes

**Logic:**
1. Query tasks WHERE remind_at BETWEEN now AND now + 15 min AND status = "pending" AND reminder_sent = false
2. For each task, send WhatsApp template message (task_reminder)
3. Set reminder_sent = true

**Example reminder message:**

> Reminder: *call dentist* is due in 30 minutes.
> Reply "done" when finished.

**Note:** Vercel Cron free tier only supports daily. For 15-min intervals, we need either:
- Vercel Pro ($20/mo) for per-minute cron
- Trigger.dev free tier (supports frequent schedules)
- Upstash QStash ($1/mo for 500 messages/day)

**V1 decision:** Use Upstash QStash for reminders ($1/mo), Vercel Cron for daily jobs (free).

### 3. Overdue Nudge

**Route:** /api/cron/overdue-nudge
**Schedule:** Daily at 8:00 PM IST

**Logic:**
1. Query users who have tasks WHERE status = "pending" AND due_at < now
2. Group overdue tasks by user
3. Send WhatsApp template message (overdue_nudge) to each user
4. Skip users with 0 overdue tasks

**Example overdue nudge message:**

> You have 2 overdue tasks:
> 1. submit report (due yesterday)
> 2. pay electricity bill (due 2 days ago)
>
> Reply "done [task]" to mark complete, or "skip [task]" to dismiss.

**Cost projections:**
- Only sends to users with overdue tasks (not all users)
- Template message cost: Rs.0.115 ($0.0014) per message
- Estimate: ~30% of users have overdue tasks on any day
- 100 users x 30% = 30 messages/day = $0.04/day = $1.26/month
- 1000 users x 30% = 300 messages/day = $0.42/day = $12.60/month

### 4. Session Cleanup

**Route:** /api/cron/session-cleanup
**Schedule:** Daily at midnight IST

**Logic:**
1. DELETE FROM web_sessions WHERE expires_at < now()
2. DELETE FROM web_sessions WHERE created_at < now() - interval 30 days
3. Log count of deleted sessions

**Cost:** Zero. No WhatsApp messages sent. Just a database cleanup query.

**Why this matters:**
- Prevents session table bloat
- Magic link tokens are single-use but expired ones pile up
- At scale (10K+ users), old sessions could be millions of rows

---

## Cost Summary

| Job | Message type | Cost per msg | Daily (100 users) | Monthly (100 users) | Daily (1K users) | Monthly (1K users) |
|---|---|---|---|---|---|---|
| Morning Brief | Template | $0.0014 | $0.14 | $4.20 | $1.40 | $42.00 |
| Task Reminders | Template | $0.0014 | $0.07 | $2.10 | $0.70 | $21.00 |
| Overdue Nudge | Template | $0.0014 | $0.04 | $1.26 | $0.42 | $12.60 |
| Session Cleanup | None | $0 | $0 | $0 | $0 | $0 |
| **Total** | | | **$0.25** | **$7.56** | **$2.52** | **$75.60** |

**Note:** These costs are ONLY for proactive messages (bot-initiated). User-reply messages within the 24-hour window are free.

### Cost optimization strategies

1. **Morning Brief opt-in:** Let users disable the morning brief (saves ~55% of message costs)
2. **Batch reminders:** Group multiple reminders into one message instead of one-per-task
3. **Skip empty briefs:** Do not send morning brief if user has 0 tasks and 0 expenses
4. **Pro-only daily nudge:** Move overdue nudge to Pro tier at scale
5. **Rate limit template messages:** Max 3 proactive messages per user per day

---

## Infrastructure Decision

### V1: Vercel Cron + Upstash QStash

| Job | Runner | Schedule |
|---|---|---|
| Morning Brief | Vercel Cron (free) | Hourly |
| Task Reminders | Upstash QStash ($1/mo) | Every 15 min |
| Overdue Nudge | Vercel Cron (free) | Daily 8 PM IST |
| Session Cleanup | Vercel Cron (free) | Daily midnight IST |

Vercel Cron free tier: 2 cron jobs, daily minimum frequency.
Upstash QStash free tier: 500 messages/day (enough for 15-min reminders up to ~500 users).

### Migration Path: Trigger.dev

When to migrate from Vercel Cron + QStash to Trigger.dev:

- **500+ users:** QStash free tier runs out (500 msgs/day)
- **Need fan-out:** Morning brief needs to process 500+ users in parallel
- **Need retries:** Failed WhatsApp sends need automatic retry with backoff
- **Need observability:** Need logs, run history, failure dashboards

Trigger.dev offers:
- Serverless background jobs with Vercel integration
- Built-in scheduling, retries, and fan-out
- Free tier: 50K runs/month
- Pay-as-you-go after that

**V1 decision: Stay with Vercel Cron + QStash.** Total cost: $1/month. Migrate when user count exceeds 500.

---

## Error Handling

All background jobs follow this error pattern:

1. **Wrap each user in try/catch** -- one user failing must not block others
2. **Log failures to Sentry** with user_id and job name
3. **Track success/failure counts** per job run
4. **Do not retry WhatsApp sends** in V1 (template messages are fire-and-forget)
5. **Set max execution time** -- Vercel serverless has 10s limit (free) or 60s (Pro)
6. **If job exceeds time limit**, process remaining users in next scheduled run

## Security

Cron endpoints must be protected from external calls:

1. Vercel Cron: verify CRON_SECRET header (auto-set by Vercel)
2. QStash: verify Upstash signature header
3. Return 401 for any request without valid auth header
4. Never expose cron routes in public API docs

---

**Next:** [07-project-structure.md](./07-project-structure.md) -- Folder and file layout
