import { createMiddleware } from "hono/factory";

import type { AppBindings } from "./types";

// Fixed window en mémoire, par utilisateur. SECURITY NOTE: pas partagé entre
// instances — remplacer par Redis si tu scales horizontalement.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: { max: number; windowMs: number }) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const key = c.var.user?.id ?? c.req.header("x-forwarded-for") ?? "anonymous";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (entry.count >= options.max) {
      return c.json(
        { message: "Trop de requêtes, réessayez plus tard.", status: 429 },
        429,
      );
    }

    entry.count += 1;
    return next();
  });
}
