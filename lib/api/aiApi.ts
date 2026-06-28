import { apiClient } from '@/lib/api/client';
import type { DetectedTask } from '@/lib/aiTaskParser';

// Miroir exact des schémas Zod backend (cf.
// backend/src/routes/ai/ai.routes.ts) — AUCUNE donnée n'est persistée côté
// serveur pour ces deux appels (stateless par design, cf.
// backend/ARCHITECTURE.md "Choix du modèle IA et transcription vocale").
export const aiApi = {
  async parseTaskFromText(text: string): Promise<DetectedTask> {
    const { data } = await apiClient.post<DetectedTask>('/api/ai/parse-task', {
      text,
      now: new Date().toISOString(),
    });
    return data;
  },

  // audioBase64 : SANS préfixe "data:audio/...;base64," — juste les données.
  async parseTaskFromAudio(audioBase64: string, format: string): Promise<DetectedTask> {
    const { data } = await apiClient.post<DetectedTask>('/api/ai/parse-task-audio', {
      audioBase64,
      format,
      now: new Date().toISOString(),
    });
    return data;
  },
};
