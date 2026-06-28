import { OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { onError, serveEmojiFavicon } from "stoker/middlewares";
import notFound from "stoker/middlewares/not-found";
import { defaultHook } from "stoker/openapi";

import env from "@/lib/env";
import type { AppBindings } from "@/lib/types";
import pinoLogger from "@/middlewares/pino-logger";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({ defaultHook });
}

export function createApp() {
  const app = createRouter();

  app.use(secureHeaders());

  // Sans ça, n'importe quel POST peut envoyer un corps arbitrairement gros
  // (coût OpenRouter, mémoire). 5 Mo couvre largement un enregistrement
  // vocal de quelques secondes en base64.
  app.use(bodyLimit({
    maxSize: 5 * 1024 * 1024,
    onError: (c) => c.json({ message: "Corps de requête trop volumineux", status: 413 }, 413),
  }));

  // CORS seulement si ALLOWED_ORIGIN défini — sinon aucun en-tête CORS,
  // ce qui bloque par défaut les appels depuis un navigateur tiers.
  if (env.ALLOWED_ORIGIN) {
    app.use(
      cors({
        origin: env.ALLOWED_ORIGIN,
        credentials: true,
      }),
    );
  }

  app.notFound(notFound);
  app.onError(onError);
  app.use(pinoLogger());
  app.use(serveEmojiFavicon("✅"));

  return app;
}
