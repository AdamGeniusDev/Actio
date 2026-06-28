import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { PinoLogger } from "hono-pino";

import type { auth } from "./auth";

// Peuplé par pino-logger (toujours) et authMiddleware (routes protégées).
export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
}

export type ContextBindings = Context<AppBindings>;
export type HonoOpenApi = OpenAPIHono<AppBindings>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;

// *.queries.ts renvoie toujours ce type plutôt que de throw — force le
// handler à gérer explicitement l'erreur.
export interface QueryError {
  message: string;
  code: string;
}

export type QueryResult<T, E = QueryError> =
  | { success: true; data: T }
  | { success: false; error: E };
