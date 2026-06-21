# Tech Stack (Revised for WhatsApp-First Product)

The original tech stack was designed for a generic PM SaaS. This is the revised stack for a WhatsApp-first personal assistant with web dashboard.

## What Changed

| Original assumption | Reality now |
|---|---|
| Web app is the product | WhatsApp is the product, web is secondary |
| Team collaboration (DnD, real-time) | Personal use only in V1 |
| File attachments + storage metering | No file uploads in V1 |
| Full-text search engine | Simple DB queries are enough |
| Complex RBAC | Single user, no roles |
| Usage-based billing | Simple free/pro subscription |

## Confirmed Stack

### Core

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15+ (App Router) | Web dashboard + API routes in one codebase |
| Database | PostgreSQL via Supabase | Managed, free tier, realtime built-in |
| ORM | Drizzle ORM | Type-safe, lightweight, SQL-like |
| Validation | Zod | Shared schemas between API and frontend |
| Hosting | Vercel | Zero-config Next.js, edge functions, free tier |
| Language | TypeScript everywhere | Reuse financial core/ engine directly |

### WhatsApp Integration

| Layer | Choice | Why |
|---|---|---|
| WhatsApp API | Meta Cloud API (free tier) | Official, reliable, free for first 1000 conversations/month |
| Webhook receiver | Next.js API route (/api/webhook/whatsapp) | No separate server needed |
| Message queue | Upstash Redis (or Inngest) | Buffer incoming messages, prevent duplicate processing |
| NLP/Intent parsing | Claude API (Haiku) | Cheap, fast, handles Hinglish naturally |

### Web Dashboard

| Layer | Choice | Why |
|---|---|---|
| Styling | Tailwind CSS 4 | Fast development, AI-friendly |
| Components | Shadcn/UI | Beautiful, accessible, customizable |
| Charts | Recharts | Simple expense/task charts |
| Forms | React Hook Form + Zod | Type-safe manual entry forms |
| State | Zustand (if needed) | Lightweight client state |

### Background Jobs

| Layer | Choice | Why |
|---|---|---|
| Scheduler | Trigger.dev or Vercel Cron | Morning briefs, reminders, overdue checks |
| Queue | Upstash Redis | Rate limiting, deduplication |

### Auth

| Layer | Choice | Why |
|---|---|---|
| Primary identity | WhatsApp phone number | Zero signup - phone number IS the account |
| Web auth | Magic link via WhatsApp | "Click this link to access your dashboard" - no password |
| Session | Supabase Auth or JWT | Standard session management for web |

### Payments (V1.5 Pro)

| Layer | Choice | Why |
|---|---|---|
| Payment gateway | Razorpay | India-first, UPI/cards/wallets, cheaper than Stripe for INR |
| Subscription | Razorpay Subscriptions | Auto-recurring Rs79/mo |

### Monitoring

| Layer | Choice | Why |
|---|---|---|
| Errors | Sentry (free tier) | Catch webhook failures, parsing errors |
| Uptime | BetterStack (free tier) | Alert if webhook goes down |
| Analytics | PostHog (free tier) | Track dashboard usage, funnel |

## Dropped from Original Stack

| Dropped | Why |
|---|---|
| dnd-kit (drag and drop) | No kanban board in V1. Simple list views. |
| Typesense/Meilisearch | Overkill. SQL LIKE queries are enough for personal data. |
| Cloudflare R2/S3 | No file uploads in V1. |
| Stripe | Razorpay is better for India (UPI support, lower fees). |
| Clerk | WhatsApp number is the identity. No traditional auth needed. |
| RBAC | Single user, no roles. |
| Resend (email) | WhatsApp IS the notification channel. No email needed. |
| Supabase Realtime | Not needed in V1. Dashboard refreshes on load. |

## Cost at Launch

| Service | Monthly cost |
|---|---|
| Vercel (hobby/pro) | /usr/bin/bash-20 |
| Supabase (free tier) | /usr/bin/bash |
| WhatsApp Cloud API (1000 convos free) | /usr/bin/bash |
| Upstash Redis (free tier) | /usr/bin/bash |
| Claude API (Haiku for parsing) | ~-15 |
| Sentry + BetterStack + PostHog | /usr/bin/bash |
| Domain | ~ |
| **Total** | **-36/mo** |
