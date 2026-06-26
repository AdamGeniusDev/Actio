import dayjs from 'dayjs';
import type { Task } from '@/types/task.types';
import type { Garant } from '@/stores/garants.store';

export type LocalNotificationType = 'overdue' | 'dueSoon' | 'garantInvite';

export interface LocalNotification {
  id:        string;
  type:      LocalNotificationType;
  title:     string;
  taskId?:   string;
  garantId?: string;
  timestamp: string; // ISO, utilisé pour le tri et l'affichage relatif
}

const DUE_SOON_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h

// Dérivé entièrement en local à partir des tâches/garants existants — pas de
// backend de notifications pour l'instant. TODO [API]: remplacer/fusionner
// avec un vrai flux serveur (push reçus, historique) une fois disponible.
export function getLocalNotifications(tasks: Task[], garants: Garant[]): LocalNotification[] {
  const now = Date.now();
  const notifications: LocalNotification[] = [];

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'failed') continue;
    const due = new Date(task.scheduledAt).getTime();

    if (due < now) {
      notifications.push({
        id: `overdue-${task.id}`,
        type: 'overdue',
        title: task.title,
        taskId: task.id,
        timestamp: task.scheduledAt,
      });
    } else if (due - now <= DUE_SOON_WINDOW_MS) {
      notifications.push({
        id: `due-${task.id}`,
        type: 'dueSoon',
        title: task.title,
        taskId: task.id,
        timestamp: task.scheduledAt,
      });
    }
  }

  for (const garant of garants) {
    if (garant.mode === 'app' && garant.inviteStatus === 'pending') {
      notifications.push({
        id: `invite-${garant.id}`,
        type: 'garantInvite',
        title: `${garant.firstName} ${garant.lastName}`.trim(),
        garantId: garant.id,
        timestamp: dayjs().toISOString(),
      });
    }
  }

  return notifications.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
