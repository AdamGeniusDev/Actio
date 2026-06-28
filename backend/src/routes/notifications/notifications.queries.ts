import { and, eq } from "drizzle-orm";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import db from "@/drizzle";
import schema from "@/drizzle/schema";
import type { QueryResult } from "@/lib/types";

const { pendingNotifications } = schema;

export type Notification = typeof pendingNotifications.$inferSelect;
type NewNotification = typeof pendingNotifications.$inferInsert;

async function createNotification(
  values: Omit<NewNotification, "id" | "status" | "sentAt" | "createdAt">,
): Promise<QueryResult<Notification>> {
  try {
    const [created] = await db.insert(pendingNotifications).values(values).returning();
    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la création: ${error}` },
    };
  }
}

// Toujours filtré par userId — un utilisateur ne peut jamais toucher l'alerte d'un autre.
async function getOwnedNotification(id: string, userId: string): Promise<QueryResult<Notification>> {
  try {
    const [found] = await db
      .select()
      .from(pendingNotifications)
      .where(and(eq(pendingNotifications.id, id), eq(pendingNotifications.userId, userId)));

    if (!found) {
      return { success: false, error: { code: HttpStatusPhrases.NOT_FOUND, message: "Alerte non trouvée" } };
    }
    return { success: true, data: found };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la lecture: ${error}` },
    };
  }
}

async function updateNotification(
  id: string,
  userId: string,
  patch: Partial<Pick<NewNotification, "scheduledAt" | "message">>,
): Promise<QueryResult<Notification>> {
  const existing = await getOwnedNotification(id, userId);
  if (!existing.success) return existing;

  try {
    const [updated] = await db
      .update(pendingNotifications)
      .set(patch)
      .where(and(eq(pendingNotifications.id, id), eq(pendingNotifications.userId, userId)))
      .returning();
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la mise à jour: ${error}` },
    };
  }
}

async function cancelNotification(id: string, userId: string): Promise<QueryResult<Notification>> {
  const existing = await getOwnedNotification(id, userId);
  if (!existing.success) return existing;

  try {
    const [cancelled] = await db
      .update(pendingNotifications)
      .set({ status: "cancelled" })
      .where(and(eq(pendingNotifications.id, id), eq(pendingNotifications.userId, userId)))
      .returning();
    return { success: true, data: cancelled };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de l'annulation: ${error}` },
    };
  }
}

async function listOwnPendingNotifications(userId: string): Promise<QueryResult<Notification[]>> {
  try {
    const rows = await db
      .select()
      .from(pendingNotifications)
      .where(and(eq(pendingNotifications.userId, userId), eq(pendingNotifications.status, "pending")));
    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la lecture: ${error}` },
    };
  }
}

const queries = {
  createNotification,
  getOwnedNotification,
  updateNotification,
  cancelNotification,
  listOwnPendingNotifications,
};

export default queries;
