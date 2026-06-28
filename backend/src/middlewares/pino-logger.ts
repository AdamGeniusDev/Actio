import { pinoLogger as honoPinoLogger } from "hono-pino";
import pino from "pino";

import env from "@/lib/env";

export default function pinoLogger() {
  return honoPinoLogger({
    pino: pino({
      level: env.LOG_LEVEL,
      // SECURITY NOTE: redact systématiquement les champs sensibles pour ne
      // jamais écrire de tokens de session/secrets dans les logs.
      redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
      transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
    }),
  });
}
