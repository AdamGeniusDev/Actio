import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { AppBindings } from "@/lib/types";

// Toute route protégée passe par ici — on ne fait JAMAIS confiance à un id
// utilisateur envoyé par le client (body/query/param) : l'identité vient
// uniquement de la session vérifiée ici et posée dans le contexte
// (c.var.user), que chaque handler doit utiliser pour ses vérifications de
// propriété (cf. ARCHITECTURE.md "Contrôle d'accès").
export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ message: "Non autorisé. Veuillez vous connecter.", status: 401 }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  } catch (error) {
    c.var.logger?.error(`Erreur dans authMiddleware: ${error}`);
    return c.json({ message: "Erreur d'authentification", status: 500 }, 500);
  }
});
