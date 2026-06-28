import { TASK_PARSING_SYSTEM_PROMPT } from "@/constants/llm";
import env from "./env";

export interface ParsedTask {
  title: string;
  iconType: "call" | "message" | "document" | "payment" | "event" | "checklist" | "goal";
  category: "work" | "personal" | "health";
  priority: "low" | "medium" | "high" | "critical";
  scheduledAt: string;
}

// tool_choice forcé sur cet outil garantit un JSON conforme au schéma.
const PARSE_TASK_TOOL = {
  type: "function" as const,
  function: {
    name: "create_task",
    description: "Crée une tâche structurée à partir de la demande de l'utilisateur",
    parameters: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        iconType: { type: "string", enum: ["call", "message", "document", "payment", "event", "checklist", "goal"] },
        category: { type: "string", enum: ["work", "personal", "health"] },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
        scheduledAt: { type: "string", description: "Date ISO 8601 complète" },
      },
      required: ["title", "iconType", "category", "priority", "scheduledAt"],
    },
  },
};

type OpenRouterMessage =
  | { role: "system" | "user"; content: string }
  | {
    role: "user";
    content: ({ type: "text"; text: string } | { type: "input_audio"; input_audio: { data: string; format: string } })[];
  };

async function callOpenRouterForTask(messages: OpenRouterMessage[], model: string): Promise<ParsedTask> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.PUBLIC_BASE_URL,
      "X-Title": "Actio",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages,
      tools: [PARSE_TASK_TOOL],
      tool_choice: { type: "function", function: { name: "create_task" } },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${body}`);
  }

  const data = await response.json() as {
    choices: { message: { tool_calls?: { function: { name: string; arguments: string } }[] } }[];
  };
  const toolCall = data.choices[0]?.message.tool_calls?.find((call) => call.function.name === "create_task");
  if (!toolCall) {
    throw new Error("Le modèle n'a renvoyé aucun appel d'outil exploitable");
  }

  return JSON.parse(toolCall.function.arguments) as ParsedTask;
}

// Stateless : rien n'est persisté avant/après l'appel.
export async function parseTaskFromText(text: string, now: string): Promise<ParsedTask> {
  return callOpenRouterForTask(
    [
      { role: "system", content: TASK_PARSING_SYSTEM_PROMPT },
      { role: "user", content: `Heure actuelle : ${now}\nDemande de l'utilisateur : "${text}"` },
    ],
    env.LLM_MODEL,
  );
}

// Transcription + extraction en un seul appel, pas de pipeline STT séparé.
export async function parseTaskFromAudio(audioBase64: string, format: string, now: string): Promise<ParsedTask> {
  return callOpenRouterForTask(
    [
      { role: "system", content: TASK_PARSING_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `Heure actuelle : ${now}\nVoici la demande de l'utilisateur, dictée à la voix :` },
          { type: "input_audio", input_audio: { data: audioBase64, format } },
        ],
      },
    ],
    env.LLM_AUDIO_MODEL,
  );
}
