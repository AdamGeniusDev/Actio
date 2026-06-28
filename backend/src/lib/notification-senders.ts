// garantContact change de sens selon le canal : téléphone (sms/whatsapp),
// email, ou Expo push token (push).

import sendEmail from "@/lib/send-email";
import { sendSmsViaTermii, sendWhatsappViaTermii } from "@/lib/termii";

// Seul canal réellement implémenté : API push Expo, gratuite, sans compte tiers.
async function sendPush(expoPushToken: string, message: string): Promise<void> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      to: expoPushToken,
      title: "Actio — Alerte Garant",
      body: message,
      sound: "default",
      priority: "high",
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo Push a refusé l'envoi (${response.status})`);
  }
  const body = await response.json() as { data?: { status?: string; message?: string } };
  if (body.data?.status === "error") {
    throw new Error(`Expo Push: ${body.data.message}`);
  }
}

async function sendSms(phone: string, message: string): Promise<void> {
  await sendSmsViaTermii(phone, message);
}

async function sendWhatsapp(phone: string, message: string): Promise<void> {
  await sendWhatsappViaTermii(phone, message);
}

async function sendEmailAlert(email: string, message: string): Promise<void> {
  await sendEmail(email, "Actio — Alerte Garant", message);
}

export async function sendNotificationViaChannel(
  channel: "sms" | "whatsapp" | "email" | "push",
  contact: string,
  message: string,
): Promise<void> {
  switch (channel) {
    case "push":
      return sendPush(contact, message);
    case "email":
      return sendEmailAlert(contact, message);
    case "sms":
      return sendSms(contact, message);
    case "whatsapp":
      return sendWhatsapp(contact, message);
  }
}
