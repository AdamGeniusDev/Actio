import * as HttpStatusCodes from "stoker/http-status-codes";

import { createLemonSqueezyCheckout, verifyLemonSqueezySignature } from "@/lib/lemonsqueezy";
import { errorJsonMessage } from "@/lib/json-message";
import { initiateProCheckout, verifyMonerooSignature } from "@/lib/moneroo";
import { resolvePaymentProvider } from "@/lib/region";
import type { AppRouteHandler } from "@/lib/types";
import env from "@/lib/env";
import queries from "./subscriptions.queries";
import type { CreateCheckout, GetStatus, LemonSqueezyWebhook, MonerooWebhook } from "./subscriptions.routes";

// Montants XOF (FCFA) — synchronisés avec les prix affichés dans le pricing screen.
const MONEROO_AMOUNTS: Record<"monthly" | "yearly", number> = {
  monthly: 2_000,
  yearly:  19_900,
};

export const createCheckoutHandler: AppRouteHandler<CreateCheckout> = async (c) => {
  const { returnUrl, countryCode, billingPeriod } = c.req.valid("json");
  const user = c.var.user;
  const provider = resolvePaymentProvider(countryCode);

  try {
    if (provider === "lemonsqueezy") {
      const { checkoutUrl } = await createLemonSqueezyCheckout({
        userId: user.id,
        email: user.email,
        returnUrl,
        billingPeriod,
      });
      return c.json({ checkoutUrl }, HttpStatusCodes.OK);
    }

    // better-auth ne stocke qu'un "name" unique ; Moneroo exige first/last séparés.
    const [firstName, ...rest] = user.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    // Moneroo exige une URL de retour HTTPS — le deep link natif (actio://) est rejeté.
    // On passe par notre propre endpoint /subscriptions/callback qui redirige vers le
    // deep link après paiement.
    const monerooReturnUrl = `${env.PUBLIC_BASE_URL}/subscriptions/callback?returnUrl=${encodeURIComponent(returnUrl)}`;

    const { checkoutUrl } = await initiateProCheckout({
      userId:   user.id,
      email:    user.email,
      firstName,
      lastName,
      amount:   MONEROO_AMOUNTS[billingPeriod],
      currency: "XOF",
      returnUrl: monerooReturnUrl,
    });
    return c.json({ checkoutUrl }, HttpStatusCodes.OK);
  } catch (error) {
    c.var.logger.error(`Échec de la création du paiement (${provider}): ${error}`);
    return errorJsonMessage(c, {
      status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: "Impossible de créer le paiement pour le moment, réessayez plus tard.",
    });
  }
};

export const getStatusHandler: AppRouteHandler<GetStatus> = async (c) => {
  const userId = c.var.user.id;

  const result = await queries.getOwnSubscription(userId);
  if (!result.success) {
    c.var.logger.error(`Échec de la lecture du statut d'abonnement: ${result.error.message}`);
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "Erreur interne" });
  }

  const sub = result.data;
  return c.json(
    {
      isPro: sub?.isPro ?? false,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    },
    HttpStatusCodes.OK,
  );
};

// Liste explicite : un événement inconnu est ignoré, jamais traité comme un succès.
const PRO_GRANTING_EVENTS = new Set(["payment.success", "subscription.active", "subscription.renewed"]);
const PRO_REVOKING_EVENTS = new Set(["subscription.cancelled", "subscription.expired", "payment.failed"]);

export const monerooWebhookHandler: AppRouteHandler<MonerooWebhook> = async (c) => {
  // Corps brut requis pour la vérification HMAC, pas c.req.valid("json").
  const rawBody = await c.req.text();
  const signature = c.req.header("x-moneroo-signature");

  if (!verifyMonerooSignature(rawBody, signature)) {
    c.var.logger.warn("Webhook Moneroo reçu avec une signature invalide — ignoré.");
    return errorJsonMessage(c, { status: HttpStatusCodes.FORBIDDEN, message: "Signature invalide" });
  }

  let payload: { event?: string; data?: { metadata?: { userId?: string }; id?: string; ends_at?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "JSON invalide" });
  }

  const event = payload.event;
  const userId = payload.data?.metadata?.userId;

  if (!event || !userId) {
    c.var.logger.warn(`Webhook Moneroo sans event ou metadata.userId — ignoré (event=${event})`);
    return c.json({ received: true }, HttpStatusCodes.OK);
  }

  const exists = await queries.userExists(userId);
  if (!exists.success || !exists.data) {
    c.var.logger.warn(`Webhook Moneroo référence un userId inconnu: ${userId}`);
    return c.json({ received: true }, HttpStatusCodes.OK);
  }

  if (PRO_GRANTING_EVENTS.has(event)) {
    await queries.upsertSubscriptionStatus({
      userId,
      isPro: true,
      provider: "moneroo",
      providerSubscriptionId: payload.data?.id,
      currentPeriodEnd: payload.data?.ends_at ? new Date(payload.data.ends_at) : undefined,
    });
  } else if (PRO_REVOKING_EVENTS.has(event)) {
    await queries.upsertSubscriptionStatus({ userId, isPro: false, provider: "moneroo" });
  }

  return c.json({ received: true }, HttpStatusCodes.OK);
};

// Basé sur le statut réel de la Subscription, pas le nom de l'événement —
// un renouvellement redéclenche "subscription_updated", jamais "_created".
const LEMONSQUEEZY_GRANTING_STATUSES = new Set(["active", "on_trial"]);
const LEMONSQUEEZY_REVOKING_EVENTS = new Set(["subscription_expired", "subscription_cancelled"]);

export const lemonSqueezyWebhookHandler: AppRouteHandler<LemonSqueezyWebhook> = async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    c.var.logger.warn("Webhook LemonSqueezy reçu avec une signature invalide — ignoré.");
    return errorJsonMessage(c, { status: HttpStatusCodes.FORBIDDEN, message: "Signature invalide" });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { id?: string; attributes?: { status?: string; renews_at?: string; ends_at?: string | null } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "JSON invalide" });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const subscription = payload.data;

  if (!eventName || !userId || !subscription) {
    c.var.logger.warn(`Webhook LemonSqueezy sans event/custom_data.user_id exploitable — ignoré (event=${eventName})`);
    return c.json({ received: true }, HttpStatusCodes.OK);
  }

  const exists = await queries.userExists(userId);
  if (!exists.success || !exists.data) {
    c.var.logger.warn(`Webhook LemonSqueezy référence un userId inconnu: ${userId}`);
    return c.json({ received: true }, HttpStatusCodes.OK);
  }

  if (LEMONSQUEEZY_REVOKING_EVENTS.has(eventName)) {
    await queries.upsertSubscriptionStatus({ userId, isPro: false, provider: "lemonsqueezy" });
  } else {
    await queries.upsertSubscriptionStatus({
      userId,
      isPro: LEMONSQUEEZY_GRANTING_STATUSES.has(subscription.attributes?.status ?? ""),
      provider: "lemonsqueezy",
      providerSubscriptionId: subscription.id,
      currentPeriodEnd: subscription.attributes?.renews_at ? new Date(subscription.attributes.renews_at) : undefined,
    });
  }

  return c.json({ received: true }, HttpStatusCodes.OK);
};
