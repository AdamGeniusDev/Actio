import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { errorJsonMessage } from "@/lib/json-message";
import type { AppRouteHandler } from "@/lib/types";
import queries from "./notifications.queries";
import type {
  CancelNotification,
  CreateNotification,
  ListNotifications,
  UpdateNotification,
} from "./notifications.routes";

// Les détails d'erreur (result.error.message) sont loggés côté serveur,
// jamais renvoyés au client — ils peuvent contenir des détails internes
// (driver Postgres, contraintes...).

export const createNotificationHandler: AppRouteHandler<CreateNotification> = async (c) => {
  const body = c.req.valid("json");
  const userId = c.var.user.id;

  const result = await queries.createNotification({ ...body, userId, scheduledAt: new Date(body.scheduledAt) });
  if (!result.success) {
    c.var.logger.error(`Échec de la création de la notification: ${result.error.message}`);
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "Erreur interne" });
  }
  return c.json(result.data, HttpStatusCodes.CREATED);
};

export const updateNotificationHandler: AppRouteHandler<UpdateNotification> = async (c) => {
  const { id } = c.req.valid("param");
  const patch = c.req.valid("json");
  const userId = c.var.user.id;

  const result = await queries.updateNotification(id, userId, {
    ...patch,
    scheduledAt: patch.scheduledAt ? new Date(patch.scheduledAt) : undefined,
  });
  if (!result.success) {
    if (result.error.code === HttpStatusPhrases.NOT_FOUND) {
      return errorJsonMessage(c, { status: HttpStatusCodes.NOT_FOUND, message: "Alerte non trouvée" });
    }
    c.var.logger.error(`Échec de la mise à jour de la notification: ${result.error.message}`);
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "Erreur interne" });
  }
  return c.json(result.data, HttpStatusCodes.OK);
};

export const cancelNotificationHandler: AppRouteHandler<CancelNotification> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.var.user.id;

  const result = await queries.cancelNotification(id, userId);
  if (!result.success) {
    if (result.error.code === HttpStatusPhrases.NOT_FOUND) {
      return errorJsonMessage(c, { status: HttpStatusCodes.NOT_FOUND, message: "Alerte non trouvée" });
    }
    c.var.logger.error(`Échec de l'annulation de la notification: ${result.error.message}`);
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "Erreur interne" });
  }
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

export const listNotificationsHandler: AppRouteHandler<ListNotifications> = async (c) => {
  const userId = c.var.user.id;

  const result = await queries.listOwnPendingNotifications(userId);
  if (!result.success) {
    c.var.logger.error(`Échec de la lecture des notifications: ${result.error.message}`);
    return errorJsonMessage(c, { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, message: "Erreur interne" });
  }
  return c.json(result.data, HttpStatusCodes.OK);
};
