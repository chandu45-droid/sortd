# Project Structure

Monorepo. Next.js handles both web dashboard and API routes. No separate backend.

## Root Layout

taskflow/
  .env.local                    # secrets (never committed)
  .env.example                  # template for new devs
  next.config.ts
  tailwind.config.ts
  drizzle.config.ts
  tsconfig.json
  package.json
  vercel.json                   # cron job schedules
  README.md

  src/
    app/                        # Next.js App Router
    lib/                        # shared utilities
    core/                       # financial engine (from financial-wellness-app)
    db/                         # Drizzle schema + migrations
    types/                      # shared TypeScript types

  public/
    favicon.ico
    og-image.png               # social preview

  tests/
    unit/
    integration/

## src/app/ -- Next.js App Router

src/app/
  layout.tsx                    # root layout (fonts, metadata, providers)
  page.tsx                      # landing page (marketing)
  globals.css                   # Tailwind base styles

  (auth)/
    login/page.tsx              # magic link request page
    verify/page.tsx             # magic link verification

  (dashboard)/                  # authenticated layout group
    layout.tsx                  # sidebar + header + auth guard
    dashboard/page.tsx          # summary view (tasks today + expenses)
    tasks/page.tsx              # task pipeline (pending/done/overdue)
    expenses/page.tsx           # expense list (filterable, searchable)
    settings/page.tsx           # user preferences

  api/
    webhook/
      whatsapp/route.ts        # POST: incoming WhatsApp messages
    auth/
      magic-link/route.ts      # POST: send magic link
      verify/route.ts          # GET: verify magic link token
      me/route.ts              # GET: current user
      logout/route.ts          # POST: clear session
    tasks/
      route.ts                 # GET: list, POST: create
      [id]/route.ts            # PATCH: update, DELETE: remove
    expenses/
      route.ts                 # GET: list, POST: create
      [id]/route.ts            # PATCH: update, DELETE: remove
    summary/route.ts           # GET: aggregated dashboard data
    settings/route.ts          # PATCH: update user prefs
    cron/
      morning-brief/route.ts   # Vercel Cron: daily morning brief
      overdue-nudge/route.ts   # Vercel Cron: daily overdue check
      session-cleanup/route.ts # Vercel Cron: expired session cleanup
      task-reminders/route.ts  # QStash: 15-min reminder check

## src/lib/ -- Shared Utilities

src/lib/
  whatsapp/
    client.ts                  # Meta Cloud API wrapper (send/receive)
    verify-signature.ts        # HMAC-SHA256 webhook verification
    templates.ts               # template message builders

  parser/
    index.ts                   # main parse() function (Layer 1 + Layer 2)
    rules.ts                   # Layer 1: regex patterns and keyword matching
    llm.ts                     # Layer 2: Claude Haiku fallback
    hinglish.ts                # Hinglish time/date/keyword mappings
    amount.ts                  # amount string to paise converter

  response/
    builder.ts                 # intent -> WhatsApp reply text
    format.ts                  # WhatsApp markdown formatting utils

  auth/
    session.ts                 # JWT creation, verification, cookie handling
    magic-link.ts              # token generation, send via WhatsApp

  jobs/
    morning-brief.ts           # morning brief logic (query + format)
    task-reminders.ts          # reminder check logic
    overdue-nudge.ts           # overdue task aggregation
    session-cleanup.ts         # expired session deletion

  utils/
    date.ts                    # timezone helpers (IST default)
    rate-limit.ts              # Upstash Redis rate limiter
    errors.ts                  # custom error classes + Sentry reporting
    validate.ts                # Zod schema helpers

## src/core/ -- Financial Engine (Reused)

Copied from financial-wellness-app/core/ with minimal changes.
All functions are pure TypeScript, no React Native dependencies.

src/core/
  categorizer.ts               # 100+ India merchant categorization rules
  evaluate.ts                   # financial health score (0-100)
  benchmarks.ts                 # budget thresholds by income band
  habits.ts                     # habit cost projections
  money.ts                      # paise math utilities
  necessity-checker.ts          # impulse spend flagging
  projector.ts                  # investment return projections (illustrative only)
  types.ts                      # Transaction, Bucket, ExpenseCategory types

## src/db/ -- Database Layer

src/db/
  index.ts                      # Drizzle client initialization
  schema.ts                     # all table definitions (users, tasks, expenses, messages, web_sessions)
  migrations/                   # Drizzle migration files (auto-generated)
  queries/
    users.ts                    # user CRUD + lookup by phone
    tasks.ts                    # task CRUD + filtered queries
    expenses.ts                 # expense CRUD + aggregations
    messages.ts                 # message log insert + recent fetch
    sessions.ts                 # web session CRUD + cleanup

## src/types/ -- Shared Types

src/types/
  intent.ts                     # ParsedIntent discriminated union
  api.ts                        # API request/response types
  whatsapp.ts                   # Meta webhook payload types
  user.ts                       # User, UserSettings types

## Dashboard Components

src/app/(dashboard)/
  components/
    sidebar.tsx                 # navigation sidebar
    header.tsx                  # top bar with user avatar + logout
    task-card.tsx               # single task in pipeline
    task-pipeline.tsx           # three columns: pending / done / overdue
    expense-row.tsx             # single expense in list
    expense-list.tsx            # filterable expense table
    summary-card.tsx            # stat card (tasks today, spend today)
    category-totals.tsx         # expense breakdown by category
    add-task-form.tsx           # manual task creation
    add-expense-form.tsx        # manual expense entry
    settings-form.tsx           # user preferences form

## Tests

tests/
  unit/
    parser/
      rules.test.ts            # Layer 1 regex tests (16 cases from 04-intent-parser.md)
      amount.test.ts           # paise conversion tests
      hinglish.test.ts         # Hinglish mapping tests
    core/
      categorizer.test.ts      # merchant categorization tests
      money.test.ts            # paise math tests
    response/
      builder.test.ts          # response formatting tests
  integration/
    whatsapp-webhook.test.ts    # webhook signature verification + processing
    auth-flow.test.ts          # magic link -> verify -> session
    task-crud.test.ts          # API task lifecycle
    expense-crud.test.ts       # API expense lifecycle
    morning-brief.test.ts      # cron job end-to-end

## Environment Variables

Required in .env.local:

| Variable | Purpose |
|---|---|
| DATABASE_URL | Supabase PostgreSQL connection string |
| WHATSAPP_TOKEN | Meta Cloud API access token |
| WHATSAPP_PHONE_ID | WhatsApp Business phone number ID |
| WHATSAPP_VERIFY_TOKEN | Webhook verification token (you set this) |
| WHATSAPP_APP_SECRET | Meta app secret for HMAC verification |
| ANTHROPIC_API_KEY | Claude API key for Layer 2 parser |
| JWT_SECRET | Secret for signing auth JWTs |
| UPSTASH_REDIS_REST_URL | Upstash Redis URL for rate limiting |
| UPSTASH_REDIS_REST_TOKEN | Upstash Redis auth token |
| QSTASH_TOKEN | Upstash QStash token for task reminders |
| CRON_SECRET | Vercel cron job auth (auto-set by Vercel) |
| SENTRY_DSN | Sentry error tracking DSN |
| NEXT_PUBLIC_APP_URL | Public URL for magic link redirects |

## vercel.json -- Cron Configuration

The cron schedule is defined in vercel.json:

- /api/cron/morning-brief: runs every hour (0 * * * *)
- /api/cron/overdue-nudge: runs daily at 2:30 PM UTC = 8:00 PM IST (30 14 * * *)
- /api/cron/session-cleanup: runs daily at 6:30 PM UTC = midnight IST (30 18 * * *)

Task reminders are handled by QStash, not Vercel Cron.

## Build Order

Recommended order for building the codebase:

1. **db/schema.ts + drizzle config** -- tables must exist first
2. **src/core/ (copy from financial-wellness-app)** -- needed by expense logging
3. **src/lib/whatsapp/ (client + verify)** -- needed by webhook
4. **src/lib/parser/ (rules + amount + hinglish)** -- needed by webhook
5. **api/webhook/whatsapp (POST handler)** -- the core product
6. **src/lib/response/builder.ts** -- bot replies
7. **api/auth/ (magic-link + verify + me)** -- web dashboard auth
8. **app/(dashboard)/ (layout + pages)** -- web dashboard UI
9. **api/tasks/ + api/expenses/** -- web CRUD
10. **api/summary/** -- dashboard data
11. **src/lib/jobs/ + api/cron/** -- background jobs
12. **tests/** -- after core features work

---

**Total files to create:** ~50 files
**Estimated build time:** 5-6 weeks solo with AI assist

---

This completes the architecture documentation. All 7 docs are ready for implementation.
