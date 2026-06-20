# TaskFlow — WhatsApp Personal Assistant → Business OS

WhatsApp AI bot that turns chat into organized life. Tasks, reminders, plans, notes — for personal use first, expanding to business/team SaaS later.

**Phase:** Product scoping (no code yet)
**Builder:** Solo, bootstrapped, AI-assisted
**Market:** India-first (500M+ WhatsApp users)

## Product Vision

**Free personal assistant** that hooks everyone → **Paid business mode** that converts power users.

| Stage | What | Users | Revenue |
|---|---|---|---|
| V1 | Personal assistant (tasks, reminders, notes, plans) | Everyone | Free (growth) |
| V1.5 | Pro features (AI planning, reports, advanced reminders) | Power users | Freemium subscription |
| V2 | Business mode (projects, team workspaces, shared tasks) | Freelancers, small teams | Usage-based pricing |
| V3 | Business OS (CRM, support, invoicing, client bot) | SMBs, agencies | Full SaaS |

## V1 Scope — Personal Assistant

- **For everyone** — gym, dates, interviews, work, errands, habits, anything
- Chat to create tasks, set reminders, make plans, save notes
- Bot sends: morning briefs, reminders, overdue nudges, daily wrap-ups
- All notification timing user-customizable
- Web dashboard for visual overview (secondary to WhatsApp)
- Zero setup — works from first message

## Hard Rules

1. **WhatsApp is the product.** Web is optional. Bot must work standalone.
2. **Zero setup, instant value.** First message = first task. No onboarding.
3. **Proactive > reactive.** Bot pushes reminders and plans without being asked.
4. **Personal first.** No team/business features in V1. Just you and your assistant.
5. **India-first UX.** Hinglish, INR, WhatsApp-native patterns.
6. **Free tier must be genuinely useful.** Not crippled. Growth comes from love, not gates.
7. **Test before claiming done.** Run the app before reporting complete.
8. **Commit & push immediately** after changes.

## Folder Structure

```
saas-pm-platform/
├── CLAUDE.md                  ← this file
├── 00-Research-Brief.md       ← original research prompt
├── research/                  ← market research (completed)
├── deliverables/              ← research deliverables (completed)
├── docs/                      ← product docs (scope, schemas, flows)
└── .claude/
    ├── agents/                ← 7 agents (chanakya + 6 specialists)
    ├── skills/                ← reusable workflows
    └── hooks/                 ← automated checks
```

## Agent Panel

| Agent | When to use |
|---|---|
| **chanakya** | Orchestrator. Plans work, assigns agents, tracks progress, reviews output. Start here. |
| **product-strategist** | Feature scoping, user flows, prioritization, product decisions |
| **system-architect** | DB schema, API design, infra, tech decisions |
| **bot-designer** | WhatsApp conversation flows, intent parsing, proactive messaging |
| **frontend** | Web dashboard UI, components, Next.js |
| **backend** | API routes, database logic, billing, metering |
| **qa** | Testing strategy, edge cases, quality checks |
