# V1 Product Scope 

**Status:** Scoping complete. Ready for architecture.

## Concept
WhatsApp personal assistant + web dashboard. Tasks + expenses in one place. Bot captures, reminds, and tracks. Web shows the big picture.

## Value Prop
No app to download. Just text. Track tasks AND expenses from WhatsApp. See everything on the web when you need the big picture.

## Two Interfaces, Two Jobs

| Interface | Job | Used for |
|---|---|---|
| WhatsApp Bot | Capture + Remind + Track | Add tasks, log expenses, get reminders, quick queries |
| Web Dashboard | Visibility + Analytics | Pipeline view, expense breakdown, streaks, trends, calendar |

## Target User
Anyone with WhatsApp. Not role-specific, not business-specific. Young India (22-35, earning 30k-3L/month) is the sweet spot for the financial features.

---

## Decision 1: Target Customer

**Everyone with WhatsApp.** Not niche. Not role-specific.

Sweet spot for financial features: Young India, 22-35, earning 30k-3L/month. But the task manager is for anyone.

## Decision 2: Core Value Prop

> Text one WhatsApp number. Your tasks get organized. Your spending gets tracked. Your morning starts with a brief. No app needed.

- Zero app install, zero signup friction
- Tasks + expenses in one chat (nobody else does this)
- WhatsApp-native for India (550M users, notifications that actually work)
- Proactive assistant (pushes briefs, reminders, spend alerts) not passive tool
- India-specific financial intelligence (100+ merchant rules)

## Decision 3: Day-1 Feature Set (Final Cut)

13 features ship on Day-1. Everything else waits.

### WhatsApp Bot - Day-1 (7 features)

| Feature | Status | Rationale |
|---|---|---|
| NL task creation ("gym 6pm tomorrow") | Day-1 | Core value prop |
| NL expense logging ("spent 200 swiggy") | Day-1 | The killer differentiator |
| Smart parsing (deadline, category, amount, merchant) | Day-1 | Must work from first message |
| Status updates ("done with dentist") | Day-1 | Basic task lifecycle |
| Quick queries ("what is left today?", "what did I spend?") | Day-1 | Instant value |
| Morning brief (tasks + yesterday spend) | Day-1 | Proactive > reactive |
| Reminders + overdue nudges | Day-1 | Core retention loop |
| Auto-categorize expenses (100+ merchant rules) | Day-1 | Already built in core/ |
| Recurring tasks ("gym every weekday") | V1.1 | Needs recurrence engine |
| Daily wrap-ups | V1.1 | Nice but not Day-1 critical |
| Spend alerts ("you hit 2000 on food") | V1.1 | Needs usage history first |
| Voice-to-task/expense | Pro | Adds WhatsApp voice parsing cost |

### Web Dashboard - Day-1 (6 features)

| Feature | Status | Rationale |
|---|---|---|
| Task pipeline (pending/done/overdue) | Day-1 | The big picture view |
| Expense list (searchable, filterable) | Day-1 | Must see what was logged |
| Monthly expense totals by category | Day-1 | Basic spend visibility |
| Manual task creation | Day-1 | Web must work standalone too |
| Manual expense entry form | Day-1 | Not everyone uses WA for everything |
| Settings (notification prefs, timezone) | Day-1 | Bare minimum config |
| Calendar view | V1.1 | Not essential Day-1 |
| Streak tracker | V1.1 | Needs recurring tasks first |
| Category breakdown charts | V1.1 | Totals are enough Day-1 |
| Health score (0-100) | Pro | Premium feature |
| Spend analytics + trends | Pro | Premium feature |
| Habit cost tracker | Pro | Premium feature |

## Decision 4: Anti-Scope (Explicit No List)

These will NOT be built in V1, even if they seem obvious.

| Feature | Why not |
|---|---|
| Bank API / UPI integration | Compliance hard rule. No money movement. |
| Specific investment recommendations | Regulatory risk. We do projections, not advice. |
| Team / shared workspaces | V2 feature. V1 is personal only. |
| Native mobile app | Web + WhatsApp is enough. Mobile app = V2/V3. |
| AI auto-planning / smart scheduling | Pro tier, not Day-1. Needs usage data first. |
| Integrations (Google Cal, Slack, etc.) | Post-launch. Manual is fine at start. |
| OCR / receipt scanning | Complex. Typing "spent 200 swiggy" is faster. |
| Multi-currency | India-first. INR only. |
| Multi-language UI | English + Hinglish in WhatsApp. Web is English only. |
| Onboarding flow / tutorial | Zero setup IS the product. No walkthrough. |
| Social / sharing / leaderboards | Personal assistant, not a social app. |
| Bill splitting | Different product (Splitwise). Not our problem. |
| Budgets with hard limits | Day-1 shows totals. Budget tracking = V1.1. |
| PDF/CSV export | Nice-to-have, not Day-1. |
| Dark mode | Ship one good theme. Polish later. |

**The one-line test:** Before building any feature, ask: "Can someone get value from this product without this?" If yes, it is not Day-1.

## Decision 5: UX Differentiator

Why not just use Todoist + Walnut?

| Competitor | What they do | What they do NOT do |
|---|---|---|
| Todoist / TickTick / Any.do | Great task managers | No expense tracking. Separate app to download. |
| Walnut / Money Manager / Khatabook | Great expense trackers | No task management. Separate app to download. |
| Generic WhatsApp bots | Some can set reminders | No persistence, no dashboard, no expense tracking. |

**Our 5 differentiators (ranked by strength):**

1. **Zero-app, zero-setup.** No download. No signup. First WhatsApp message = working.
2. **Tasks + Expenses in one chat.** Nobody does this. Two problems, one interface.
3. **WhatsApp-native for India.** 550M users already have it open 20+ times/day. Notifications that actually work on Android.
4. **Proactive assistant, not passive tool.** Pushes morning briefs, expense summaries, overdue nudges. Works even when you forget.
5. **India-specific financial intelligence.** 100+ Indian merchant rules. Swiggy, Zomato, Uber, HDFC EMI auto-categorized.

## Decision 6: Naming and Positioning

**Name:** TBD ("TaskFlow" is the working name but does not reflect the finance angle. Final name to be picked closer to launch.)

**Positioning (locked):**

| Do | Do NOT |
|---|---|
| "WhatsApp personal assistant" | "AI-powered productivity SaaS" |
| "Track tasks and spending from one chat" | "Unified life management platform" |
| "No app needed" | "Cross-platform solution" |
| "Your morning starts with a brief" | "Proactive notification engine" |
| "Built for India" | "Global productivity tool" |

**Positioning statement:**
> The WhatsApp assistant that organizes your tasks and tracks your spending. No app to download. Just text.

## Decision 7: Success Gate

### Launch Readiness (all must pass before going public)

| Check | Criteria |
|---|---|
| Bot responds to first message | < 3 seconds, no errors |
| Task creation works | 5 different NL formats all parse correctly |
| Expense logging works | 5 different formats all parse and categorize |
| Morning brief sends | At configured time with tasks + expense summary |
| Reminders fire | Set a reminder, receive it on time |
| Web dashboard loads | Pipeline view + expense list render with real data |
| Web manual entry works | Can create task + log expense from web |
| Auto-categorization works | Top 20 merchants categorize correctly |
| No compliance violations | No securities advice, disclaimers on projections |
| Works on low-end Android | Web dashboard renders on Jio phone browser |

### Post-Launch Metrics (first 30 days)

| Metric | Target | Why |
|---|---|---|
| Users who send 2+ messages | 100 | Proves bot is usable beyond curiosity |
| Day-7 retention | 30%+ | Industry WA bot benchmark is ~20%, we must beat it |
| Expenses logged | 500+ total | Proves financial tracking is used |
| Tasks created | 1000+ total | Proves task management is used |
| Morning brief open rate | 40%+ | Proves proactive messaging has value |
| Web dashboard visits | 50+ unique | Proves people want the visual overview |
| Organic referrals | 10+ | Product-market fit signal |

### Kill Criteria

| Signal | Action |
|---|---|
| < 20 users after 2 weeks of promotion | Pivot positioning or kill |
| < 10% Day-7 retention | Fix onboarding / first-message experience |
| 0 expenses logged (only tasks) | Finance angle not landing, lead with tasks |
| 0 tasks (only expenses) | Task angle not landing, lead with expenses |
| Compliance complaint | Immediately audit all financial language |

---

## Feature Tiers (Complete)

### Financial Features by Tier

| Feature | Day-1 (Free) | V1.1 (Free) | Pro |
|---|---|---|---|
| Log expenses via WhatsApp | Y | Y | Y |
| Log expenses via web | Y | Y | Y |
| Auto-categorize (100+ India merchants) | Y | Y | Y |
| Monthly totals | Y | Y | Y |
| Category breakdown charts | | Y | Y |
| Daily/weekly spend alerts | | Y | Y |
| Expense summary in morning brief | | Y | Y |
| Financial health score (0-100) | | | Y |
| Habit cost tracker + projections | | | Y |
| Investment projector (FD, PPF, equity) | | | Y |
| Necessity checker (impulse alerts) | | | Y |
| Spend benchmarks vs peers | | | Y |
| Spend analytics + insights | | | Y |

### Task Features by Tier

| Feature | Day-1 (Free) | V1.1 (Free) | Pro |
|---|---|---|---|
| NL task creation via WhatsApp | Y | Y | Y |
| Reminders + overdue nudges | Y | Y | Y |
| Morning brief | Y | Y | Y |
| Web pipeline view | Y | Y | Y |
| Recurring tasks + streaks | | Y | Y |
| Daily wrap-ups | | Y | Y |
| Calendar view | | Y | Y |
| Snooze/reschedule | | Y | Y |
| AI planner (auto-schedule day) | | | Y |
| Task analytics + trends | | | Y |
| Voice-to-task | | | Y |

## Compliance Rules (HARD - from Financial Wellness App)

These rules MUST be followed in all financial features:

1. **No specific securities/funds/stocks.** Never recommend specific instruments.
2. **No fee for advice.** Financial features are product features, not advisory.
3. **No money movement.** No bank API, no UPI, no payment initiation.
4. **Disclaimers required.** All projections carry "illustrative only, not financial advice."
5. **Branding: wellness/insights/tracker** not advisor/advice/buy/sell.

## Reusable Engine (from financial-wellness-app/core/)

| Module | What it does | Reuse |
|---|---|---|
| categorizer.ts | 100+ India merchant rules | Direct reuse |
| benchmarks.ts | Budget thresholds by income band | Direct reuse |
| evaluate.ts | Financial health score (0-100) | Rewire to server data |
| habits.ts | Habit cost projections | Direct reuse |
| money.ts | Paise math utilities | Direct reuse |
| necessity-checker.ts | Impulse spend flagging | Direct reuse |
| projector.ts | Investment return projections | Direct reuse |
| sms-parser.ts | Bank SMS parsing patterns | Adapt for WhatsApp format |
| types.ts | Full data model | Extend for server schema |
| crypto.ts | Encryption utils | Drop (server handles) |

## Growth Path

V1 Free personal (tasks + expenses) > V1.5 Pro (AI planning, health score, analytics) > V2 Teams > V3 Business OS

---

## Decisions Log

| # | Decision | Choice | Date |
|---|---|---|---|
| 1 | Target customer | Everyone with WhatsApp, sweet spot young India 22-35 | 2026-06-21 |
| 2 | Core value prop | Zero-app task + expense tracking via WhatsApp | 2026-06-21 |
| 3 | Day-1 feature set | 13 features (7 WhatsApp + 6 web) | 2026-06-21 |
| 4 | Anti-scope | 15 explicit nos (no bank API, no mobile app, no AI planning) | 2026-06-21 |
| 5 | UX differentiator | Zero-setup + tasks+expenses in one chat + India-native | 2026-06-21 |
| 6 | Naming and positioning | Name TBD, positioning locked (WhatsApp assistant for tasks+spending) | 2026-06-21 |
| 7 | Success gate | 10 launch checks + 7 post-launch metrics + 5 kill criteria | 2026-06-21 |
| - | Product type | Personal assistant first, SaaS later | 2026-06-21 |
| - | Primary interface | WhatsApp bot (capture + remind) | 2026-06-21 |
| - | Secondary interface | Web dashboard (visibility + analytics) | 2026-06-21 |
| - | V1 revenue | Free (growth-first) | 2026-06-21 |
| - | Financial tracking merge | Absorb financial-wellness-app into TaskFlow (Option A) | 2026-06-21 |
| - | Standalone finance app | Killed, all features fold into TaskFlow | 2026-06-21 |
| - | Financial compliance | Carry forward all hard rules | 2026-06-21 |

## Open Questions

All 7 scope decisions are resolved. Remaining questions for architecture phase:

- [ ] WhatsApp expense message format: strict or fuzzy parsing?
- [ ] DB schema design (tasks + expenses + users)
- [ ] WhatsApp Business API setup and webhook architecture
- [ ] Intent parser design (task vs expense vs query)
- [ ] Web dashboard wireframes
- [ ] Pro tier billing integration
