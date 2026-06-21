# WhatsApp Webhook Architecture

## How Meta Cloud API Works

1. You register a WhatsApp Business phone number with Meta
2. You set a webhook URL (our API route)
3. When someone texts your number, Meta POSTs to your webhook
4. You process the message and reply via Meta Send API

## Message Flow

```
User sends "spent 200 swiggy"
           |
           v
[Meta Cloud API] --- POST ---> [/api/webhook/whatsapp]
                                      |
                                      v
                              1. Verify webhook signature
                              2. Extract phone + message text
                              3. Dedup (check wa_message_id)
                              4. Find or create user by phone
                              5. Log inbound message
                                      |
                                      v
                              [Intent Parser]
                              "spent 200 swiggy"
                                      |
                                      v
                              intent: expense_log
                              amount: 20000 (paise)
                              merchant: swiggy
                              category: food
                                      |
                                      v
                              [Action Handler]
                              INSERT into expenses
                                      |
                                      v
                              [Response Builder]
                              "Got it! Rs200 on food (Swiggy)"
                                      |
                                      v
                              POST to Meta Send API
                              Log outbound message
```

## Webhook Endpoint

```
GET  /api/webhook/whatsapp   -- Meta verification (returns challenge token)
POST /api/webhook/whatsapp   -- Incoming messages
```

### GET (Verification)
Meta sends a one-time verification request when you register the webhook.
Return the hub.challenge token if hub.verify_token matches your secret.

### POST (Incoming Message)
Meta sends message events. Key fields:

```
body.entry[0].changes[0].value.messages[0] = {
  id: "wamid.xxx",           // Unique message ID (for dedup)
  from: "919876543210",       // Sender phone (no + prefix)
  timestamp: "1687654321",
  type: "text",
  text: { body: "spent 200 swiggy" }
}
```

## Processing Pipeline

Each incoming message goes through 5 stages:

| Stage | What | Failure mode |
|---|---|---|
| 1. Validate | Check webhook signature, extract message | Reject silently (Meta retries) |
| 2. Dedup | Check wa_message_id in messages table | Skip if already processed |
| 3. Identify | Find user by phone or create new user | Auto-create on first message |
| 4. Parse | Run intent parser on message text | If unparseable, ask user to clarify |
| 5. Act | Execute the parsed intent (create task, log expense, run query) | Log error, send apology message |
| 6. Respond | Build and send reply via Meta Send API | Retry 3x, then log failure |

## Sending Messages (Outbound)

Two types of outbound messages:

### 1. Replies (within 24-hour window)
After user sends a message, we have 24 hours to reply for free.
All immediate responses (confirmations, query results) are replies.

### 2. Template Messages (proactive, outside 24-hour window)
Morning briefs, reminders, overdue nudges are PROACTIVE.
These require pre-approved message templates and cost Rs0.115/message.

Templates needed:

| Template | Content | When sent |
|---|---|---|
| morning_brief | Tasks for today + yesterday spend summary | Daily at user-set time |
| task_reminder | "Reminder: {task_title} is due in {time}" | Before task deadline |
| overdue_nudge | "You have {count} overdue tasks" | Daily check |

## Rate Limiting

- Meta allows 80 messages/second per phone number
- Free tier: 1000 service conversations/month
- Template messages: Rs0.115 each (utility category)
- Store rate limit state in Upstash Redis

## Error Handling

| Error | Response to user |
|---|---|
| Could not parse message | "I did not understand that. Try: spent 200 swiggy or gym 6pm tomorrow" |
| Database error | "Something went wrong. Your message is saved, I will process it shortly." |
| Meta API down | Queue outbound message in Redis, retry |
| Duplicate message | Ignore silently (already processed) |

## First Message Experience

When a new phone number texts for the first time:

1. Auto-create user record (phone only, no name yet)
2. Parse their first message normally (it becomes their first task or expense)
3. Reply with confirmation + one-line intro:
   "Got it! Rs200 on food (Swiggy). I am your personal assistant - I track tasks and expenses. Just text me anytime."
4. No onboarding flow. No setup. They are already using the product.
