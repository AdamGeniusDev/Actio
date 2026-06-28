import { createRouter } from "@/lib/create-app";
import { rateLimit } from "@/lib/rate-limit";
import { authMiddleware } from "@/middlewares/auth.middlewares";
import {
  createCheckoutHandler,
  getStatusHandler,
  lemonSqueezyWebhookHandler,
  monerooWebhookHandler,
} from "./subscriptions.handlers";
import { createCheckout, getStatus, lemonSqueezyWebhook, monerooWebhook } from "./subscriptions.routes";

// Routeur public isolé (pas authMiddleware) pour qu'un webhook ne puisse
// jamais se retrouver protégé par erreur lors d'un futur refactor.
const publicRouter = createRouter()
  .openapi(monerooWebhook, monerooWebhookHandler)
  .openapi(lemonSqueezyWebhook, lemonSqueezyWebhookHandler);

const protectedRouter = createRouter();
protectedRouter.use(authMiddleware);
// Limité sur la création de checkout uniquement — getStatus est sondé
// toutes les 2s par l'écran de succès (cf. hooks/api/useSubscription.ts côté app).
protectedRouter.use("/subscriptions/checkout", rateLimit({ max: 10, windowMs: 10 * 60 * 1000 }));
protectedRouter
  .openapi(createCheckout, createCheckoutHandler)
  .openapi(getStatus, getStatusHandler);

const subscriptionsRouter = createRouter()
  .route("/", publicRouter)
  .route("/", protectedRouter);

export default subscriptionsRouter;
