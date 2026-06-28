import { Scalar } from "@scalar/hono-api-reference";

import packageJson from "../../package.json";
import type { HonoOpenApi } from "./types";

// /docs = JSON OpenAPI généré depuis les schémas Zod. /doc = UI Scalar pour le lire.
export default function configureOpenAPI(app: HonoOpenApi) {
  app.doc("/docs", {
    openapi: "3.0.0",
    info: {
      version: packageJson.version,
      title: "Actio API",
      description: "Documentation de l'API backend Actio — strict minimum côté serveur (notifications Garant, IA, abonnements).",
    },
  });

  app.get(
    "/doc",
    Scalar({
      theme: "elysiajs",
      layout: "classic",
      sources: [
        { url: "/docs", title: "Actio API" },
        { url: "/api/auth/open-api/generate-schema", title: "Auth" },
      ],
    }),
  );
}
