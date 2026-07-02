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

// GET /subscriptions/callback — Moneroo redirige ici (HTTPS obligatoire) après
// paiement. On fait une simple redirection 302 vers le deep link app passé en
// query param. Aucune auth requise : Moneroo appelle cet endpoint, pas l'app.
publicRouter.on("GET", "/subscriptions/callback", async (c) => {
  const appReturnUrl = c.req.query("returnUrl");
  if (!appReturnUrl) return c.text("Missing returnUrl", 400);
  return c.redirect(appReturnUrl, 302);
});

const protectedRouter = createRouter();
protectedRouter.use(authMiddleware);
// Limité sur la création de checkout uniquement — getStatus est sondé
// toutes les 2s par l'écran de succès (cf. hooks/api/useSubscription.ts côté app).
// 5 tentatives / minute : assez généreux pour les relances légitimes, protège quand même.
protectedRouter.use("/subscriptions/checkout", rateLimit({ max: 5, windowMs: 60 * 1000 }));
protectedRouter
  .openapi(createCheckout, createCheckoutHandler)
  .openapi(getStatus, getStatusHandler);

const subscriptionsRouter = createRouter()
  .route("/", publicRouter)
  .route("/", protectedRouter);

export default subscriptionsRouter;
