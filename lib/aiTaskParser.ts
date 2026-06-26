import dayjs from 'dayjs';
import type { TaskIconType, TaskCategory, TaskPriority } from '@/types/task.types';

export interface DetectedTask {
  title:       string;
  iconType:    TaskIconType;
  category:    TaskCategory;
  priority:    TaskPriority;
  scheduledAt: string; // ISO
}

// TODO [API]: remplacer par un vrai pipeline backend (transcription audio +
// extraction LLM avec sortie structurée). Ceci est un heuristique local par
// mots-clés, qui permet de faire fonctionner le flux UI de bout en bout tant
// que le backend n'existe pas — il ne comprend pas vraiment la phrase.
export function analyzeVoiceInput(text: string): DetectedTask {
  const lower = text.toLowerCase();

  let iconType: TaskIconType = 'checklist';
  if (/appel|call|téléphon/.test(lower))        iconType = 'call';
  else if (/message|whatsapp|texto|sms/.test(lower)) iconType = 'message';
  else if (/payer|facture|paiement/.test(lower))     iconType = 'payment';
  else if (/réunion|rdv|rendez-vous|meeting/.test(lower)) iconType = 'event';
  else if (/document|dossier|fichier|rapport/.test(lower)) iconType = 'document';

  let priority: TaskPriority = 'medium';
  if (/urgent|important/.test(lower))   priority = 'high';
  if (/critique|absolument|asap/.test(lower)) priority = 'critical';

  let scheduledAt = dayjs().add(1, 'hour');
  if (/demain/.test(lower)) scheduledAt = dayjs().add(1, 'day').hour(9).minute(0);
  if (/ce soir/.test(lower)) scheduledAt = dayjs().hour(19).minute(0);

  const title = text
    .trim()
    .replace(/^(je dois|il faut que je|faut que je|i need to|i have to)\s*/i, '')
    .replace(/^./, (c) => c.toUpperCase());

  return {
    title: title || text,
    iconType,
    category: 'work',
    priority,
    scheduledAt: scheduledAt.toISOString(),
  };
}
