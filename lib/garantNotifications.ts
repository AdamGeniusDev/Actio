import type { Garant } from '@/stores/garants.store';
import type { NotificationChannel } from '@/lib/api/notificationsApi';

// Un seul canal par alerte côté backend — priorité au plus immédiat.
const DIRECT_CHANNEL_PRIORITY: NotificationChannel[] = ['whatsapp', 'sms', 'email'];

// null = pas alertable (canal/contact manquant) — l'appelant ne doit pas appeler le backend.
export function resolveChannelAndContact(garant: Garant): { channel: NotificationChannel; contact: string } | null {
  if (garant.mode === 'app') {
    // TODO [API]: push token non collecté pour les Garants "app" — fallback email.
    return garant.email ? { channel: 'email', contact: garant.email } : null;
  }

  if (!garant.contact || !garant.channels) return null;

  const activeChannel = DIRECT_CHANNEL_PRIORITY.find((c) => garant.channels?.[c as 'sms' | 'whatsapp' | 'email']);
  return activeChannel ? { channel: activeChannel, contact: garant.contact } : null;
}

// Court, sans détail de tâche au-delà du titre (politique de confidentialité).
export function buildAlertMessage(taskTitle: string, userFirstName: string): string {
  return `${userFirstName} n'a pas encore confirmé : "${taskTitle}". Merci de vérifier que tout va bien.`;
}
