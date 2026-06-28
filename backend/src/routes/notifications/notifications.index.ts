import { createRouter } from "@/lib/create-app";
import { rateLimit } from "@/lib/rate-limit";
import { authMiddleware } from "@/middlewares/auth.middlewares";
import {
  cancelNotificationHandler,
  createNotificationHandler,
  listNotificationsHandler,
  updateNotificationHandler,
} from "./notifications.handlers";
import {
  cancelNotification,
  createNotification,
  listNotifications,
  updateNotification,
} from "./notifications.routes";

// Toutes les routes de ce fichier nécessitent une session valide — aucune
// alerte ne peut être créée/lue/modifiée sans être authentifié.
const notificationsRouter = createRouter().basePath("/");
notificationsRouter.use(authMiddleware);
// SECURITY: garantContact n'est pas vérifié comme appartenant à
// l'utilisateur — sans limite, un compte pourrait spammer un contact
// arbitraire via ce serveur.
notificationsRouter.use(rateLimit({ max: 30, windowMs: 10 * 60 * 1000 }));

notificationsRouter
  .openapi(createNotification, createNotificationHandler)
  .openapi(updateNotification, updateNotificationHandler)
  .openapi(cancelNotification, cancelNotificationHandler)
  .openapi(listNotifications, listNotificationsHandler);

export default notificationsRouter;
