import {
  Phone, MessageCircle, FileText, Wallet, CalendarDays, CheckSquare, Target,
  type LucideIcon,
} from 'lucide-react-native';

import type { TaskIconType, TaskAction } from '@/types/task.types';

export const ICON_TYPE_ICON: Record<TaskIconType, LucideIcon> = {
  call:      Phone,
  message:   MessageCircle,
  document:  FileText,
  payment:   Wallet,
  event:     CalendarDays,
  checklist: CheckSquare,
  goal:      Target,
};

export const ICON_TYPE_COLOR: Record<TaskIconType, string> = {
  call:      '#FF6B1A',
  message:   '#00D68F',
  document:  '#4D9EFF',
  payment:   '#FFB800',
  event:     '#4D9EFF',
  checklist: '#8BA3BE',
  goal:      '#FF3B5C',
};

// Construit l'URL système (tel:/mailto:/wa.me/lien direct) à partir d'une
// action de tâche — utilisé par AlarmOverlay et le détail de tâche, qui
// déclenchent tous les deux la même action via Linking.openURL.
export function buildActionUrl(action: TaskAction): string {
  switch (action.type) {
    case 'call':     return `tel:${action.payload}`;
    case 'email':    return `mailto:${action.payload}`;
    case 'whatsapp': return `https://wa.me/${action.payload.replace(/\D/g, '')}`;
    case 'open_url':
    default:         return action.payload;
  }
}
