# API Routes

All API routes live in Next.js App Router at /api/. Two categories: WhatsApp webhook (bot) and web dashboard (CRUD).

## Route Map

| Method | Route | Purpose | Auth |
|---|---|---|---|
| GET | /api/webhook/whatsapp | Meta verification challenge | None (Meta token) |
| POST | /api/webhook/whatsapp | Incoming WhatsApp messages | None (signature verify) |
| POST | /api/auth/magic-link | Request web login via WhatsApp | None (sends WA message) |
| GET | /api/auth/verify | Verify magic link token | None (token in URL) |
| GET | /api/auth/me | Get current user | Session cookie |
| POST | /api/auth/logout | Clear session | Session cookie |
| GET | /api/tasks | List tasks (filterable) | Session cookie |
| POST | /api/tasks | Create task | Session cookie |
| PATCH | /api/tasks/:id | Update task | Session cookie |
| DELETE | /api/tasks/:id | Delete task | Session cookie |
| GET | /api/expenses | List expenses (filterable) | Session cookie |
| POST | /api/expenses | Create expense | Session cookie |
| PATCH | /api/expenses/:id | Update expense | Session cookie |
| DELETE | /api/expenses/:id | Delete expense | Session cookie |
| GET | /api/summary | Dashboard summary (tasks + expenses) | Session cookie |
| PATCH | /api/settings | Update user preferences | Session cookie |

## 1. WhatsApp Webhook

### GET /api/webhook/whatsapp

Meta sends this once during setup to verify webhook ownership.

**Query params:** hub.mode, hub.verify_token, hub.challenge

**Logic:**
1. Check hub.mode === "subscribe"
2. Check hub.verify_token matches our WEBHOOK_VERIFY_TOKEN env var
3. Return hub.challenge as plain text (200)
4. If mismatch, return 403

### POST /api/webhook/whatsapp

All incoming WhatsApp messages arrive here.

**Logic:**
1. Verify X-Hub-Signature-256 header (HMAC-SHA256 with app secret)
2. Return 200 immediately (Meta retries on timeout)
3. Process async: extract message -> dedup by wa_message_id -> identify/create user -> parse intent -> execute action -> send reply
4. Log raw message to messages table

**Failure handling:**
- Invalid signature: 401, log alert
- Duplicate message: skip silently, return 200
- Parse failure: reply with help text, log for review
- DB error: reply with "Something went wrong, try again", log error

## 2. Auth Routes

No email/password. Phone number IS the identity.

### POST /api/auth/magic-link

**Request body:** { phone: "+91XXXXXXXXXX" }

**Logic:**
1. Validate phone format (E.164, must start with +91 for V1)
2. Check user exists (must have sent at least 1 WhatsApp message first)
3. Generate random token (32 bytes, hex)
4. Store in web_sessions table (token, user_id, expires_at = now + 15 min)
5. Send WhatsApp template message with login link
6. Return { sent: true }

**If user not found:** Return 404 "Send a message to our WhatsApp number first"

### GET /api/auth/verify?token=xxx

**Logic:**
1. Look up token in web_sessions
2. Check not expired
3. Set HTTP-only session cookie (JWT with user_id, expires in 30 days)
4. Delete used token from web_sessions
5. Redirect to /dashboard

### GET /api/auth/me

**Response:** { id, phone, name, tier, created_at } or 401

### POST /api/auth/logout

Clear session cookie. Redirect to /.

## 3. Task Routes

### GET /api/tasks

**Query params:**
- status: pending / done / overdue / all (default: all)
- due: today / this_week / this_month / all (default: all)
- sort: due_at / created_at (default: due_at)
- order: asc / desc (default: asc)
- limit: number (default: 50, max: 200)
- offset: number (default: 0)

**Response:** { tasks: [...], total: number }

### POST /api/tasks

**Request body:**
- title (required, string, max 500 chars)
- due_at (optional, ISO datetime)
- remind_at (optional, ISO datetime)
- category (optional, string)

**Logic:**
1. Validate with Zod schema
2. Set source = "web"
3. INSERT into tasks table
4. Return created task (201)

### PATCH /api/tasks/:id

**Request body:** Any subset of { title, status, due_at, remind_at, category }

**Logic:**
1. Verify task belongs to authenticated user
2. If status changing to "done", set completed_at = now
3. UPDATE and return updated task

### DELETE /api/tasks/:id

Soft delete (set status = "deleted") or hard delete. V1: hard delete.

## 4. Expense Routes

### GET /api/expenses

**Query params:**
- period: today / this_week / this_month / all (default: this_month)
- category: food / transport / rent / etc. (optional filter)
- sort: transaction_date / amount_paise (default: transaction_date)
- order: asc / desc (default: desc)
- limit: number (default: 50, max: 200)
- offset: number (default: 0)

**Response:** { expenses: [...], total: number, sum_paise: number }

### POST /api/expenses

**Request body:**
- amount_paise (required, integer, > 0)
- category (required, from predefined list)
- merchant (optional, string)
- description (optional, string)
- transaction_date (optional, defaults to today)

**Logic:**
1. Validate with Zod schema
2. If merchant provided but no category, run categorizer.ts
3. Set source = "web"
4. INSERT into expenses table
5. Return created expense (201)

### PATCH /api/expenses/:id

**Request body:** Any subset of { amount_paise, category, merchant, description, transaction_date }

Verify ownership, UPDATE, return updated expense.

### DELETE /api/expenses/:id

Verify ownership, hard delete.

## 5. Dashboard Summary Route

### GET /api/summary

Single endpoint for the dashboard home page. Returns everything needed in one call.

**Response:**
- tasks_today: { pending: number, done: number, overdue: number }
- tasks_this_week: { pending: number, done: number, overdue: number }
- expenses_today: { total_paise: number, count: number }
- expenses_this_month: { total_paise: number, count: number, by_category: { [category]: number } }
- recent_tasks: last 5 tasks
- recent_expenses: last 5 expenses

**Why one endpoint?** Dashboard loads fast with a single API call instead of 4-5 parallel calls. Reduces latency on low-end Android phones.

## 6. Settings Route

### PATCH /api/settings

**Request body:** Any subset of:
- name (string)
- timezone (string, e.g. "Asia/Kolkata")
- morning_brief_time (string, e.g. "07:00")
- monthly_income_paise (integer)
- city_tier (1 / 2 / 3)

**Response:** Updated user object.

## Validation & Error Handling

### Validation

Every route uses Zod schemas for input validation. Shared schemas between web forms and API routes.

### Error Response Format

All errors return consistent JSON:
- 400: { error: "validation_error", message: "Title is required", field: "title" }
- 401: { error: "unauthorized", message: "Please log in" }
- 403: { error: "forbidden", message: "This task belongs to another user" }
- 404: { error: "not_found", message: "Task not found" }
- 500: { error: "internal", message: "Something went wrong" }

### Rate Limiting

- Web API: 100 requests/minute per user (via Upstash Redis ratelimit)
- WhatsApp webhook: no rate limit on our end (Meta handles theirs)
- Magic link: 3 requests/hour per phone number (prevent spam)

## Middleware Stack

Applied to all /api/ routes except webhook:

1. **Rate limiter** -- Upstash Redis, per-user
2. **Auth check** -- Verify session cookie, attach user to request
3. **Input validation** -- Zod parse, return 400 on failure
4. **Handler** -- Business logic
5. **Error boundary** -- Catch unhandled errors, log to Sentry, return 500

## Route Count Summary

| Category | Routes | Notes |
|---|---|---|
| WhatsApp webhook | 2 | GET (verify) + POST (messages) |
| Auth | 4 | magic-link, verify, me, logout |
| Tasks | 4 | CRUD |
| Expenses | 4 | CRUD |
| Dashboard | 1 | Aggregated summary |
| Settings | 1 | User preferences |
| **Total** | **16** | Lean. No over-engineering. |

---

**Next:** [06-background-jobs.md](./06-background-jobs.md) -- Scheduled jobs and proactive messaging
