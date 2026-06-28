import * as HttpStatusCodes from "stoker/http-status-codes";

import { errorJsonMessage } from "@/lib/json-message";
import { parseTaskFromAudio, parseTaskFromText } from "@/lib/llm";
import type { AppRouteHandler } from "@/lib/types";
import type { ParseTask, ParseTaskAudio } from "./ai.routes";

export const parseTaskHandler: AppRouteHandler<ParseTask> = async (c) => {
  const { text, now } = c.req.valid("json");

  try {
    const result = await parseTaskFromText(text, now);
    return c.json(result, HttpStatusCodes.OK);
  } catch (error) {
    c.var.logger.error(`Échec du parsing IA: ${error}`);
    return errorJsonMessage(c, {
      status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: "L'assistant IA est momentanément indisponible, réessayez ou créez la tâche manuellement.",
    });
  }
};

export const parseTaskAudioHandler: AppRouteHandler<ParseTaskAudio> = async (c) => {
  const { audioBase64, format, now } = c.req.valid("json");

  try {
    const result = await parseTaskFromAudio(audioBase64, format, now);
    return c.json(result, HttpStatusCodes.OK);
  } catch (error) {
    c.var.logger.error(`Échec du parsing IA (audio): ${error}`);
    return errorJsonMessage(c, {
      status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message: "L'assistant IA est momentanément indisponible, réessayez ou créez la tâche manuellement.",
    });
  }
};
