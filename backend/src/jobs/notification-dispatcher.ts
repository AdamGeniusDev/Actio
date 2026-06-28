// Processus séparé (script "jobs:dispatcher") : un bug ici ne doit jamais
// impacter l'API. Limite connue : polling mono-instance — passer à une
// vraie file (pg-boss, BullMQ) si tu scales horizontalement.
import { and, eq, lte } from "drizzle-orm";

import db from "@/drizzle";
import schema from "@/drizzle/schema";
import { sendNotificationViaChannel } from "@/lib/notification-senders";

const { pendingNotifications } = schema;
const POLL_INTERVAL_MS = 30_000;

async function dispatchDueNotifications(): Promise<void> {
  const due = await db
    .select()
    .from(pendingNotifications)
    .where(and(eq(pendingNotifications.status, "pending"), lte(pendingNotifications.scheduledAt, new Date())));

  for (const notification of due) {
    try {
      await sendNotificationViaChannel(notification.channel, notification.garantContact, notification.message);
      await db
        .update(pendingNotifications)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(pendingNotifications.id, notification.id));
      console.log(`[dispatcher] Alerte ${notification.id} envoyée (${notification.channel}).`);
    } catch (error) {
      await db
        .update(pendingNotifications)
        .set({ status: "failed" })
        .where(eq(pendingNotifications.id, notification.id));
      console.error(`[dispatcher] Échec de l'alerte ${notification.id}: ${error}`);
    }
  }
}

async function loop(): Promise<void> {
  try {
    await dispatchDueNotifications();
  } catch (error) {
    console.error(`[dispatcher] Erreur dans la boucle de dispatch: ${error}`);
  }
  setTimeout(loop, POLL_INTERVAL_MS);
}

console.log(`[dispatcher] Démarré — vérification toutes les ${POLL_INTERVAL_MS / 1000}s.`);
void loop();
