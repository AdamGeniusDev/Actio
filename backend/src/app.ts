import { createApp, createRouter } from "@/lib/create-app";
import configureOpenAPI from "@/lib/configure-openapi";
import { auth } from "@/lib/auth";
import env from "@/lib/env";
import aiRouter from "@/routes/ai/ai.index";
import notificationsRouter from "@/routes/notifications/notifications.index";
import subscriptionsRouter from "@/routes/subscriptions/subscriptions.index";

const app = createApp();

configureOpenAPI(app);

// better-auth gère lui-même tout /api/auth/* (login, signup, sessions,
// vérification email, et son propre schéma OpenAPI via le plugin openAPI()).
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Toutes les routes "métier" sont préfixées par /api pour rester distinctes
// du namespace /api/auth ci-dessus.
const apiRouter = createRouter()
  .route("/", notificationsRouter)
  .route("/", aiRouter)
  .route("/", subscriptionsRouter);

app.route("/api", apiRouter);

console.log(`🚀 Actio backend démarré sur le port ${env.PORT}`);
console.log(`📚 Documentation interactive : ${env.PUBLIC_BASE_URL}/doc`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
