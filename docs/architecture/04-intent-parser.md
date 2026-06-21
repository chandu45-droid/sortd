# Intent Parser Design

The parser converts raw WhatsApp messages into structured intents. This is the brain of the bot.

## Architecture Decision: Hybrid (Rules + LLM)

**Layer 1: Regex rules (fast, free, handles 80%% of messages)**
- Amount detection, expense keywords, known merchants, time/date patterns
- Runs first, takes ~1ms

**Layer 2: Claude Haiku (handles ambiguous 20%%)**
- Only called when Layer 1 is uncertain
- Takes ~200-500ms, costs ~$0.0001 per call
- Handles: Hinglish, complex sentences, multi-intent messages

This keeps costs near zero for most messages while handling edge cases gracefully.

## Intent Types

| Intent | Example messages | Action |
|---|---|---|
| task_create | gym 6pm tomorrow, call dentist Friday | INSERT task |
| expense_log | spent 200 swiggy, chai 50, rent 15k | INSERT expense |
| task_done | done with dentist, gym done | UPDATE task status |
| task_skip | skip gym today | UPDATE task status |
| query_tasks | what is left today?, what is overdue? | SELECT tasks |
| query_expenses | what did I spend today?, food spend this week? | SELECT expenses |
| query_summary | how am I doing?, this month summary | Aggregate query |
| set_profile | call me Rahul, I earn 50k | UPDATE user |
| help | help, what can you do? | Send help text |
| unknown | anything unparseable | Ask for clarification |

## Layer 1: Rule-Based Parser

### Expense Detection Rules (checked first)

A message is an expense if it has BOTH:
- An amount (number pattern)
- An expense signal (keyword OR known merchant)

**Amount patterns:**
| Input | Parsed as |
|---|---|
| 200 | 20000 paise |
| 200rs / rs200 | 20000 paise |
| 2k | 200000 paise |
| 2.5k | 250000 paise |
| 15000 | 1500000 paise |
| 1,500 | 150000 paise |

**Expense keywords (English + Hinglish):**
spent, paid, expense, kharcha, kharach, bill, cost

**Known merchants (from categorizer.ts -- 100+ rules):**
swiggy, zomato, uber, ola, rapido, netflix, hotstar, amazon, flipkart, myntra, bigbasket, blinkit, zepto, hdfc, icici, sbi, axis, kotak, paytm, phonepe, gpay...

**Category keywords (when no merchant):**

| Keywords | Category |
|---|---|
| food, chai, coffee, lunch, dinner, breakfast | food |
| auto, cab, petrol, diesel, metro, bus | transport |
| rent, maintenance, society | rent |
| emi, loan | emi |
| wifi, electricity, gas, water, recharge | utilities |
| movie, drinks, party | entertainment |
| clothes, shoes, shopping | shopping |

**Decision logic (pseudocode):**

1. IF has_amount AND (has_expense_keyword OR has_known_merchant OR has_category_keyword) -> expense_log (confidence: high)
2. ELIF has_amount AND message_is_short (< 5 words) -> expense_log (confidence: medium, may need LLM)
3. ELIF matches_done_pattern (done, finished, completed, ho gaya) -> task_done
4. ELIF matches_skip_pattern (skip, cancel, nahi, mat) -> task_skip
5. ELIF matches_query_pattern (what, how much, kitna, list, show) -> query (task or expense based on keywords)
6. ELIF has_time_or_date -> task_create (confidence: high)
7. ELSE -> task_create (confidence: medium, may need LLM)

## Layer 2: LLM Fallback (Claude Haiku)

Only called when Layer 1 confidence is medium or low.

**Prompt template:**

> You are a WhatsApp assistant parser. Classify this message and extract data.
> User message: "{message}"
> Respond ONLY with JSON containing: intent, task_title, due_at, amount_paise, merchant, category, query_type, time_range

**Valid intents:** task_create, expense_log, task_done, task_skip, query_tasks, query_expenses, set_profile, help, unknown

**Cost estimate:**
- Haiku input: ~50 tokens (prompt + message)
- Haiku output: ~30 tokens (JSON response)
- Cost per call: ~$0.0001
- If 20% of messages need LLM: 1000 users x 5 msgs/day x 20% = 1000 LLM calls/day = $0.10/day

## Edge Cases

| Message | Challenge | Resolution |
|---|---|---|
| 200 | Just a number, no context | Ask: Is this an expense? What was it for? |
| swiggy | Known merchant but no amount | Ask: How much was the Swiggy order? |
| done | Which task? | If 1 pending task today, mark it. Otherwise ask. |
| meeting 200 | Task or expense? | Has time-like word (meeting) -> task. No amount keyword -> task. |
| paid rent | Expense but no amount | Ask: How much was the rent? |
| kal gym | Hinglish (kal = tomorrow) | Layer 1 maps kal/aaj/parso to dates |
| gym nahi gaya | Skipped task (Hinglish) | Layer 1 maps nahi/mat/skip patterns |
| 200 uber 150 swiggy | Two expenses in one message | Split and process both |

## Hinglish Time/Date Mappings

| Hinglish | English | Parsed as |
|---|---|---|
| aaj | today | today |
| kal | tomorrow (or yesterday by context) | tomorrow (default) |
| parso | day after tomorrow | +2 days |
| subah | morning | 7:00 AM |
| dopahar | afternoon | 1:00 PM |
| shaam | evening | 6:00 PM |
| raat | night | 9:00 PM |
| hafta | week | 7 days |
| mahina | month | 30 days |

## Parser Output Schema (TypeScript)

The parser returns a discriminated union type:

- **task_create:** title (string), dueAt (Date?), remindAt (Date?), category (string?)
- **expense_log:** amountPaise (number), merchant (string?), category (string), date (Date?)
- **task_done:** taskQuery (string)
- **task_skip:** taskQuery (string)
- **query_tasks:** filter (today / overdue / all / pending)
- **query_expenses:** filter (today / this_week / this_month), category (string?)
- **query_summary:** period (today / this_week / this_month)
- **set_profile:** field (string), value (string)
- **help:** (no data)
- **unknown:** raw (string)

## Response Builder

After parsing, the response builder generates WhatsApp-friendly replies.

| Intent | Success Response | Error Response |
|---|---|---|
| task_create | *gym* -- tomorrow 6:00 PM. Will remind 30 min before. | Could not understand time. When should I remind you? |
| expense_log | Rs.200 logged -> Food (Swiggy). Today total: Rs.850 | How much did you spend? |
| task_done | *dentist* -- marked done! 3 tasks left today. | Which task? 1. gym 2. call mom 3. buy groceries |
| task_skip | *gym* skipped for today. | (same as task_done error) |
| query_tasks | *Today:* 1. gym -- 6 PM 2. call mom 3. dentist (done) | No tasks for today. |
| query_expenses | *Today:* Food Rs.450, Transport Rs.150. Total Rs.600 | No expenses logged today. |
| query_summary | *This week:* 12 done, 3 pending. Rs.4200 spent (Food Rs.1800) | Not enough data yet. Keep logging! |
| set_profile | Morning brief set to 7:00 AM. | What time for your morning brief? |
| help | *I can help:* Tasks, Expenses, Queries -- type help for examples | -- |
| unknown | Not sure what you mean. Type *help* for examples. | -- |

## Response Formatting Rules

1. **Use WhatsApp markdown:** *bold* for emphasis, no HTML, no links unless needed
2. **Keep replies under 300 chars** -- nobody reads walls of text in WhatsApp
3. **Always confirm what was parsed** -- so user can correct mistakes
4. **Include running totals** where relevant -- Today total: Rs.850
5. **Emoji as status indicators** -- use sparingly for done/pending/overdue
6. **Never ask two questions at once** -- one clarification per reply
7. **Hinglish-friendly** -- accept Hindi words but respond in English

## Testing Strategy

### Unit Test Cases (minimum)

**Task creation:**
- gym 6pm tomorrow -> task_create { title: gym, dueAt: tomorrow 18:00 }
- call mom -> task_create { title: call mom }
- buy groceries by friday -> task_create { title: buy groceries, dueAt: friday }
- dentist kal subah -> task_create { title: dentist, dueAt: tomorrow 07:00 }

**Expense logging:**
- spent 200 swiggy -> expense_log { amount: 20000, merchant: swiggy, category: food }
- chai 50 -> expense_log { amount: 5000, category: food }
- uber 150 -> expense_log { amount: 15000, merchant: uber, category: transport }
- 2.5k rent -> expense_log { amount: 250000, category: rent }
- kharcha 500 groceries -> expense_log { amount: 50000, category: groceries }

**Task completion:**
- done gym -> task_done { taskQuery: gym }
- finished dentist -> task_done { taskQuery: dentist }

**Queries:**
- what is left today -> query_tasks { filter: today }
- how much did I spend -> query_expenses { filter: today }
- this week spending -> query_expenses { filter: this_week }
- summary -> query_summary { period: this_week }

### Integration Tests

1. Send 50 real-world messages collected from beta users
2. Verify >90%% parse correctly with Layer 1 alone
3. Verify >99%% parse correctly with Layer 1 + Layer 2
4. Measure average response time (target: <500ms for Layer 1, <2s for Layer 2)
5. Test deduplication -- same message sent twice should not create duplicate tasks/expenses

---

**Next:** [05-api-routes.md](./05-api-routes.md) -- Web dashboard API routes
