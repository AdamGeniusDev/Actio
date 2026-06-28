import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { errorSchema } from "@/lib/zod-openapi-error-schema";

const tags = ["IA"];

export const ParsedTaskSchema = z.object({
  title: z.string(),
  iconType: z.enum(["call", "message", "document", "payment", "event", "checklist", "goal"]),
  category: z.enum(["work", "personal", "health"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  scheduledAt: z.iso.datetime(),
});

// Stateless : rien n'est lu ni écrit en base pour cette route.
export const parseTask = createRoute({
  tags,
  method: "post",
  path: "/ai/parse-task",
  summary: "Extraire une tâche structurée à partir d'un texte (dicté ou écrit)",
  request: {
    body: jsonContentRequired(
      z.object({
        text: z.string().min(1).max(2000),
        now: z.iso.datetime(), // heure locale du client, pour résoudre "demain"/"dans 2h"
      }),
      "Texte à analyser et heure actuelle du client",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ParsedTaskSchema, "Tâche structurée détectée"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "Erreur de validation"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Trop de requêtes"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne ou IA indisponible"),
  },
});

// Audio envoyé directement à un modèle multimodal, pas de STT séparé.
export const parseTaskAudio = createRoute({
  tags,
  method: "post",
  path: "/ai/parse-task-audio",
  summary: "Extraire une tâche structurée à partir d'un enregistrement vocal",
  request: {
    body: jsonContentRequired(
      z.object({
        // ~6 Mo de base64 ≈ quelques minutes d'audio m4a — large marge sur
        // l'usage attendu (dicter une tâche), tout en bornant la requête
        // (cf. body-limit global dans create-app.ts, défense en profondeur).
        audioBase64: z.string().min(1).max(8_000_000).describe("Audio encodé en base64 (sans préfixe data: URI)"),
        format: z.enum(["wav", "mp3", "m4a", "aac", "ogg", "flac"]).default("m4a"),
        now: z.iso.datetime(),
      }),
      "Audio à transcrire/analyser et heure actuelle du client",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ParsedTaskSchema, "Tâche structurée détectée"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, "Erreur de validation"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, "Non authentifié"),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(errorSchema, "Trop de requêtes"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, "Erreur interne ou IA indisponible"),
  },
});

export type ParseTask = typeof parseTask;
export type ParseTaskAudio = typeof parseTaskAudio;
