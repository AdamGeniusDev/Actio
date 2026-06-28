import { z } from "@hono/zod-openapi";

// Forme d'erreur unique réutilisée par toutes les routes — cf. json-message.ts
// qui construit exactement cette forme côté handler.
export const errorSchema = z.object({
  message: z.string(),
  status: z.number(),
  errors: z.array(z.string()).optional(),
});

export const genericErrorSchema = z.object({
  message: z.string(),
  status: z.number(),
});
