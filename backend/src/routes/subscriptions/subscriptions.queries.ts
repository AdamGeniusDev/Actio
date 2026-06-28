import { eq } from "drizzle-orm";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import db from "@/drizzle";
import schema from "@/drizzle/schema";
import type { QueryResult } from "@/lib/types";

const { subscriptions } = schema;

export type Subscription = typeof subscriptions.$inferSelect;

async function getOwnSubscription(userId: string): Promise<QueryResult<Subscription | null>> {
  try {
    const [found] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return { success: true, data: found ?? null };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la lecture: ${error}` },
    };
  }
}

// Appelé uniquement depuis le handler de webhook, après vérification de la
// signature Moneroo — jamais depuis une route accessible au client mobile.
// Upsert : un utilisateur a au plus une ligne d'abonnement.
async function upsertSubscriptionStatus(values: {
  userId: string;
  isPro: boolean;
  provider: "moneroo" | "lemonsqueezy";
  providerSubscriptionId?: string;
  currentPeriodEnd?: Date;
}): Promise<QueryResult<Subscription>> {
  try {
    const [updated] = await db
      .insert(subscriptions)
      .values({
        userId: values.userId,
        isPro: values.isPro,
        provider: values.provider,
        providerSubscriptionId: values.providerSubscriptionId,
        currentPeriodEnd: values.currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          isPro: values.isPro,
          provider: values.provider,
          providerSubscriptionId: values.providerSubscriptionId,
          currentPeriodEnd: values.currentPeriodEnd,
          updatedAt: new Date(),
        },
      })
      .returning();
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la mise à jour: ${error}` },
    };
  }
}

async function userExists(userId: string): Promise<QueryResult<boolean>> {
  try {
    const { user } = schema;
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
    return { success: true, data: !!found };
  } catch (error) {
    return {
      success: false,
      error: { code: HttpStatusPhrases.INTERNAL_SERVER_ERROR, message: `Échec de la vérification: ${error}` },
    };
  }
}

const queries = { getOwnSubscription, upsertSubscriptionStatus, userExists };

export default queries;
