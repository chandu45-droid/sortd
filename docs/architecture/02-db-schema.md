# Database Schema

PostgreSQL via Supabase. Drizzle ORM for type-safe queries.

## Core Principle

Phone number = identity. No email, no password, no OAuth. WhatsApp number is the account.

## Tables

### users

The user record is created automatically on first WhatsApp message.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,            -- WhatsApp number (E.164: +919876543210)
  name TEXT,                              -- Optional, set by user ("call me Rahul")
  timezone TEXT DEFAULT 'Asia/Kolkata',   -- For scheduling briefs/reminders
  morning_brief_time TIME DEFAULT '07:00', -- When to send morning brief
  tier TEXT DEFAULT 'free',               -- free | pro
  monthly_income_paise BIGINT,            -- Optional, for health score
  city_tier TEXT,                          -- metro | tier1 | tier2 | tier3
  onboarded_at TIMESTAMPTZ,               -- When they completed optional profile
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_phone ON users(phone);
```

### tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                    -- Parsed task title
  raw_message TEXT,                       -- Original WhatsApp message
  status TEXT DEFAULT 'pending',          -- pending | done | overdue | skipped
  category TEXT,                          -- work | health | personal | social | errands | other
  due_at TIMESTAMPTZ,                     -- Deadline (nullable for no-deadline tasks)
  remind_at TIMESTAMPTZ,                  -- When to send reminder (nullable)
  completed_at TIMESTAMPTZ,               -- When marked done
  source TEXT DEFAULT 'whatsapp',         -- whatsapp | web
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at);
CREATE INDEX idx_tasks_remind ON tasks(remind_at) WHERE remind_at IS NOT NULL AND status = 'pending';
```

### expenses

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,           -- Always paise (Rs200 = 20000)
  category TEXT NOT NULL,                  -- food | transport | subscriptions | rent | emi | utilities | entertainment | shopping | misc
  merchant TEXT,                           -- Parsed merchant ("Swiggy", "Uber")
  description TEXT,                        -- Original message or note
  source TEXT DEFAULT 'whatsapp',         -- whatsapp | web
  transaction_date DATE NOT NULL,          -- Date of expense (default today)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, transaction_date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_user_month ON expenses(user_id, date_trunc('month', transaction_date));
```

### messages

Audit log of all WhatsApp messages (inbound + outbound). Useful for debugging and replay.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wa_message_id TEXT UNIQUE,              -- WhatsApp message ID (dedup)
  direction TEXT NOT NULL,                 -- inbound | outbound
  body TEXT NOT NULL,                      -- Message text
  intent TEXT,                             -- task_create | expense_log | query_task | query_expense | status_update | unknown
  parsed_data JSONB,                       -- What the parser extracted
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id);
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);
```

### web_sessions

For web dashboard authentication via magic link.

```sql
CREATE TABLE web_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,             -- Magic link token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON web_sessions(token) WHERE expires_at > NOW();
```

## Relationships

```
users 1---* tasks      (one user has many tasks)
users 1---* expenses   (one user has many expenses)
users 1---* messages   (one user has many messages)
users 1---* web_sessions (one user can have many sessions)
```

## Key Design Decisions

1. **Phone number is the primary identity.** No email field. WhatsApp number = account.
2. **Paise, not rupees.** All amounts stored as BIGINT paise. Rs200 = 20000. Avoids floating point.
3. **Source tracking.** Every task and expense records where it came from (whatsapp/web).
4. **Message audit log.** Every inbound/outbound WhatsApp message is stored for debugging and replay.
5. **No recurring tasks table yet.** V1.1 feature. When needed, add a recurrence_rules table.
6. **No monthly_summaries table yet.** Compute on the fly in V1. Materialize when query performance matters.
7. **Soft delete not needed.** Personal data, user owns everything. Hard delete is fine.
8. **Timezone per user.** India is mostly IST but storing per-user allows future expansion.

## Row Count Estimates (1000 users, 6 months)

| Table | Rows | Growth rate |
|---|---|---|
| users | 1,000 | Slow |
| tasks | 50,000 | ~3 tasks/user/day |
| expenses | 30,000 | ~2 expenses/user/day |
| messages | 150,000 | ~5 messages/user/day (in+out) |
| web_sessions | 2,000 | Ephemeral, expire regularly |

All comfortably within Supabase free tier (500MB).
