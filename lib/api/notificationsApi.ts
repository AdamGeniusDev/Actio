import { apiClient } from '@/lib/api/client';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push';

export interface RemoteNotification {
  id: string;
  clientTaskId: string;
  garantContact: string;
  channel: NotificationChannel;
  message: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt: string | null;
  createdAt: string;
}

// Miroir exact de backend/src/routes/notifications/notifications.routes.ts —
// c'est la SEULE chose que ce serveur sait de tes tâches : qu'une alerte
// existe pour un clientTaskId opaque, à programmer pour tel contact/canal.
// Jamais le titre, la description ni quoi que ce soit d'autre sur la tâche
// (cf. backend/ARCHITECTURE.md "Principe de minimisation des données").
export const notificationsApi = {
  async create(params: {
    clientTaskId: string;
    garantContact: string;
    channel: NotificationChannel;
    message: string;
    scheduledAt: string;
  }): Promise<RemoteNotification> {
    const { data } = await apiClient.post<RemoteNotification>('/api/notifications', params);
    return data;
  },

  async update(id: string, patch: { scheduledAt?: string; message?: string }): Promise<RemoteNotification> {
    const { data } = await apiClient.patch<RemoteNotification>(`/api/notifications/${id}`, patch);
    return data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${id}`);
  },
};
