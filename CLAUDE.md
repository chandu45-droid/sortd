# TaskFlow — WhatsApp-First Personal Ops Assistant

WhatsApp AI bot that turns chat messages into organized tasks, projects, and docs. Web dashboard for the big picture. Usage-based pricing.

**Phase:** Product scoping (no code yet)
**Builder:** Solo, bootstrapped, AI-assisted
**Market:** India-first (WhatsApp-native audience)

## Product Layers

| Layer | What | Priority |
|---|---|---|
| WhatsApp Bot | Create/update tasks, smart parsing, proactive reminders & reports | Core — THE interface |
| Web Dashboard | Kanban, calendar, project views, reports, settings | Secondary — big picture view |
| Docs/Notes | Quick notes via chat, organized by project, searchable on web | Lightweight wiki |

## V1 Scope

- **Self-centric** — single user, no team features yet
- Chat to create/manage tasks and projects
- Bot sends: morning briefs, deadline reminders, overdue alerts, weekly reports
- User controls all notification timing and types
- Web dashboard for visual overview and bulk management
- Usage-based billing (storage, AI calls, message volume)

## V1 → V2 → V3

- **V1:** Personal assistant (WhatsApp + PM + Docs)
- **V2:** Team workspaces (multi-user, assignments, shared docs)
- **V3:** Business OS (CRM + Support + Invoicing + client-facing bot)

## Hard Rules

1. **WhatsApp is primary, web is secondary.** Design bot-first, dashboard-second.
2. **Smart defaults, zero setup.** Bot should work from first message — no onboarding wizard.
3. **Proactive > reactive.** Bot should push updates, not wait to be asked.
4. **Usage-based pricing is the USP.** Metering built from day 1, not bolted on.
5. **India-first UX.** Hinglish support, INR pricing, WhatsApp-native patterns.
6. **No feature-gating.** Every user gets every feature. Pay for resources consumed.
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
