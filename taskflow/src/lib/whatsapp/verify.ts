/**
 * WhatsApp webhook signature verification.
 * Verifies X-Hub-Signature-256 header using HMAC-SHA256 with app secret.
 */
import { createHmac } from "crypto";

/**
 * Verify the X-Hub-Signature-256 header from Meta's webhook.
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null
): boolean {
  if (!signature) return false;

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("WHATSAPP_APP_SECRET not set — cannot verify webhook");
    return false;
  }

  const expectedSignature =
    "sha256=" +
    createHmac("sha256", appSecret)
      .update(typeof rawBody === "string" ? rawBody : rawBody)
      .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify the Meta webhook verification challenge (GET request during setup).
 * Returns the challenge token if valid, null otherwise.
 */
export function verifyChallenge(params: {
  "hub.mode"?: string;
  "hub.verify_token"?: string;
  "hub.challenge"?: string;
}): string | null {
  const mode = params["hub.mode"];
  const token = params["hub.verify_token"];
  const challenge = params["hub.challenge"];

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }

  return null;
}
