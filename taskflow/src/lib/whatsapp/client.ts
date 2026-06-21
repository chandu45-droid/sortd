/**
 * WhatsApp Cloud API client — send messages via Meta's API.
 * Handles both free replies (within 24h window) and paid template messages.
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID not set");
  return id;
}

function getToken(): string {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN not set");
  return token;
}

/**
 * Send a free-form text reply (within 24-hour conversation window).
 * This is the primary response method — free of charge.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<{ messageId: string }> {
  const phoneNumberId = getPhoneNumberId();
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? "unknown" };
}

/**
 * Send a template message (proactive, outside 24h window).
 * Used for morning briefs, reminders, overdue nudges.
 * Cost: Rs 0.115 per message.
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "en",
  components: TemplateComponent[] = []
): Promise<{ messageId: string }> {
  const phoneNumberId = getPhoneNumberId();
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WhatsApp template send failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? "unknown" };
}

/**
 * Mark a message as read (sends blue ticks).
 */
export async function markAsRead(messageId: string): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "currency" | "date_time";
  text?: string;
}

/** Extracted message data from a WhatsApp webhook payload */
export interface IncomingMessage {
  /** Unique WhatsApp message ID (for dedup) */
  waMessageId: string;
  /** Sender phone number (no + prefix, e.g., "919876543210") */
  from: string;
  /** Message timestamp */
  timestamp: string;
  /** Message type */
  type: "text" | "image" | "audio" | "document" | "unknown";
  /** Text body (only for text messages) */
  body: string | null;
}

/**
 * Extract message data from a WhatsApp webhook payload.
 * Returns null if the payload doesn't contain a processable message.
 */
export function extractMessage(
  payload: Record<string, unknown>
): IncomingMessage | null {
  try {
    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<
      string,
      unknown
    >;
    const value = changes?.value as Record<string, unknown>;
    const messageArr = value?.messages as Record<string, unknown>[];

    if (!messageArr || messageArr.length === 0) return null;

    const msg = messageArr[0];
    const msgType = msg.type as string;
    const textObj = msg.text as Record<string, unknown> | undefined;

    return {
      waMessageId: msg.id as string,
      from: msg.from as string,
      timestamp: msg.timestamp as string,
      type: ["text", "image", "audio", "document"].includes(msgType)
        ? (msgType as IncomingMessage["type"])
        : "unknown",
      body: textObj?.body as string | null,
    };
  } catch {
    return null;
  }
}
