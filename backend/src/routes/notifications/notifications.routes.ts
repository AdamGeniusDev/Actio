import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { errorSchema } from "@/lib/zod-openapi-error-schema";

const tags = ["Notifications"];

// 320 = longueur max d'un email (RFC 5321) — généreux aussi pour un numéro
// de téléphone. Borne défensive, la vraie protection contre l'abus est le
// rate limit (cf. notifications.index.ts).
const garantContactSchema = z.string().min(1).max(320);

// Une alerte "tâche" n'a pas vocation à être programmée plus de 90 jours à
// l'avance — borne défensive contre une ligne qui resterait pending indéfiniment.
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const scheduledAtSchema = z.iso.datetime().refine(
  (value) => new Date(value).getTime() <= Date.now() + NINETY_DAYS_MS,
  { message: "scheduledAt ne peut pas être à plus de 90 jours dans le futur" },
);

export const NotificationSchema = z.object({
  id: z.uuid(),
  clientTaskId: z.string(),
  garantContact: z.string(),
  channel: z.enum(["sms", "whatsapp", "email", "push"]),
  message: z.string(),
  scheduledAt: z.iso.datetime(),
  status: z.enum(["pending", "sent", "failed", "cancelled"]),
  sentAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

// Seul endroit où le contact du Garant et le message transitent par le
// serveur — jamais le contenu complet de la tâche.
export const createNotification = createRoute({
  tags,
  method: "post",
  path: "/notifications",
  summary: "Programmer une alerte Garant",
  request: {
    body: jsonContentRequired(
      z.object({
        clientTaskId: z.string().min(1),
        garantContact: garantContactSchema,
        channel: z.enum(["sms", "whatsapp", "email", "push"]),
        message: z.string().min(1).max(500),
        scheduledAt: scheduledAtSchema,
      }),
      "Détails de l'alerte à programmer",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(NotificationSchema, "Alerte programmée"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "Erreur de validation"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

export const updateNotification = createRoute({
  tags,
  method: "patch",
  path: "/notifications/{id}",
  summary: "Reprogrammer une alerte Garant existante",
  request: {
    params: z.object({ id: z.uuid() }),
    body: jsonContentRequired(
      z.object({
        scheduledAt: scheduledAtSchema.optional(),
        message: z.string().min(1).max(500).optional(),
      }),
      "Champs à mettre à jour",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(NotificationSchema, "Alerte mise à jour"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "Erreur de validation"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "Alerte non trouvée"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

export const cancelNotification = createRoute({
  tags,
  method: "delete",
  path: "/notifications/{id}",
  summary: "Annuler une alerte Garant programmée",
  request: {
    params: z.object({ id: z.uuid() }),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Alerte annulée" },
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, "Alerte non trouvée"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

export const listNotifications = createRoute({
  tags,
  method: "get",
  path: "/notifications",
  summary: "Lister mes alertes Garant en attente",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.array(NotificationSchema), "Liste des alertes en attente"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne"),
  },
});

export type CreateNotification = typeof createNotification;
export type UpdateNotification = typeof updateNotification;
export type CancelNotification = typeof cancelNotification;
export type ListNotifications = typeof listNotifications;
