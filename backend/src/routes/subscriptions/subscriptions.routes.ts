import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { errorSchema } from "@/lib/zod-openapi-error-schema";

const tags = ["Abonnement"];

export const SubscriptionStatusSchema = z.object({
  isPro: z.boolean(),
  currentPeriodEnd: z.iso.datetime().nullable(),
});

// Choisit Moneroo (Afrique) ou LemonSqueezy (reste du monde) selon countryCode.
export const createCheckout = createRoute({
  tags,
  method: "post",
  path: "/subscriptions/checkout",
  summary: "Créer un lien de paiement pour l'abonnement Pro",
  request: {
    body: jsonContentRequired(
      z.object({
        returnUrl: z.url().describe("URL/deep-link vers laquelle rediriger après paiement"),
        countryCode: z.string().length(2).optional(), // heuristique de routage, pas une donnée de sécurité
        billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"), // LemonSqueezy uniquement
      }),
      "URL de retour après paiement, et pays/période pour choisir le prestataire et le prix",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ checkoutUrl: z.url() }), "Lien de paiement créé"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "Erreur de validation"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur Moneroo ou interne"),
  },
});

export const getStatus = createRoute({
  tags,
  method: "get",
  path: "/subscriptions/status",
  summary: "Consulter mon statut d'abonnement Pro",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SubscriptionStatusSchema, "Statut actuel"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

// PUBLIC : Moneroo s'authentifie par signature HMAC, pas par session (cf. lib/moneroo.ts).
export const monerooWebhook = createRoute({
  tags,
  method: "post",
  path: "/subscriptions/webhook/moneroo",
  summary: "Webhook Moneroo (événements de paiement)",
  request: {
    body: jsonContentRequired(z.record(z.string(), z.unknown()), "Payload brut envoyé par Moneroo"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ received: z.boolean() }), "Événement traité"),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(errorSchema, "Signature invalide"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

// PUBLIC : même principe, signature HMAC via X-Signature (cf. lib/lemonsqueezy.ts).
export const lemonSqueezyWebhook = createRoute({
  tags,
  method: "post",
  path: "/subscriptions/webhook/lemonsqueezy",
  summary: "Webhook LemonSqueezy (événements d'abonnement)",
  request: {
    body: jsonContentRequired(z.record(z.string(), z.unknown()), "Payload brut envoyé par LemonSqueezy"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ received: z.boolean() }), "Événement traité"),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(errorSchema, "Signature invalide"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

export type CreateCheckout = typeof createCheckout;
export type GetStatus = typeof getStatus;
export type MonerooWebhook = typeof monerooWebhook;
export type LemonSqueezyWebhook = typeof lemonSqueezyWebhook;
