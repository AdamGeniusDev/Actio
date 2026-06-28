import env from "@/lib/env";

// Une seule API pour SMS et WhatsApp — seul le "channel" change.
const BASE_URL = env.TERMII_BASE_URL ?? "https://v3.api.termii.com";

async function sendViaTermii(phone: string, message: string, channel: "dnd" | "whatsapp"): Promise<void> {
  if (!env.TERMII_API_KEY || !env.TERMII_SENDER_ID) {
    throw new Error(`Termii non configuré (TERMII_API_KEY / TERMII_SENDER_ID manquant) — canal ${channel}`);
  }

  const response = await fetch(`${BASE_URL}/api/sms/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: env.TERMII_API_KEY,
      to: phone,
      from: env.TERMII_SENDER_ID,
      sms: message,
      type: "plain",
      channel,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Termii a refusé l'envoi (${response.status}): ${text}`);
  }

  const body = await response.json() as { code?: string; message?: string };
  if (body.code !== "ok") {
    throw new Error(`Termii: ${body.message ?? "échec inconnu"}`);
  }
}

// "dnd" = canal recommandé par Termii pour le transactionnel (vs "generic").
export function sendSmsViaTermii(phone: string, message: string): Promise<void> {
  return sendViaTermii(phone, message, "dnd");
}

export function sendWhatsappViaTermii(phone: string, message: string): Promise<void> {
  return sendViaTermii(phone, message, "whatsapp");
}
