import type { TaskIconType, TaskCategory, TaskPriority } from '@/types/task.types';

// Forme renvoyée par le backend (POST /api/ai/parse-task, /api/ai/parse-task-audio)
// — cf. backend/src/lib/llm.ts. Le parsing lui-même se fait entièrement côté
// serveur (cf. lib/api/aiApi.ts) ; ce fichier ne contient plus que le type
// partagé entre l'API et l'UI.
export interface DetectedTask {
  title:       string;
  iconType:    TaskIconType;
  category:    TaskCategory;
  priority:    TaskPriority;
  scheduledAt: string; // ISO
}
