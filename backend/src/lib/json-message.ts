import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppBindings } from "./types";

interface ErrorJsonOptions<T extends ContentfulStatusCode = ContentfulStatusCode> {
  message: string;
  status: T;
  errors?: string[];
}

// Réponse d'erreur JSON cohérente — toujours la même forme
// { message, status, errors? } quelle que soit la route, pour que le client
// mobile puisse parser les erreurs de façon uniforme.
export function errorJsonMessage<T extends ContentfulStatusCode>(
  c: Context<AppBindings>,
  options: ErrorJsonOptions<T>,
) {
  const { message, status, errors } = options;
  return c.json({ message, status, errors }, status);
}
