import { addDays } from '@/utils/date.utils';
import type { Task } from '@/types/task.types';
import type {
  ActivityDay,
  CategoryBreakdown,
  RecentActivityEntry,
  StatsCategory,
} from '@/types/stats.types';

/** Construit un ISO string pour aujourd'hui + offset jours, à l'heure donnée. */
function at(daysOffset: number, hours: number, minutes: number): string {
  const d = addDays(new Date(), daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const now = new Date().toISOString();

export const MOCK_TASKS: Task[] = [
  // ── Dimanche (J-3) — une tâche en retard pour tester le point rouge
  {
    id: '1',
    title: 'Préparer le brief client',
    description: undefined,
    category: 'work',
    iconType: 'document',
    priority: 'medium',
    status: 'pending',
    scheduledAt: at(-3, 10, 0),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Mardi (J-1) — tâche en retard, non complétée
  {
    id: '2',
    title: 'Séance de sport',
    description: '30 min cardio + étirements',
    category: 'health',
    iconType: 'checklist',
    priority: 'medium',
    status: 'pending',
    scheduledAt: at(-1, 7, 0),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Aujourd'hui — tâches variées, dont l'appel client en cours (cf. maquettes alarme/détail)
  {
    id: '3',
    title: 'Client Feedback Call',
    description: "Appel de suivi avec l'équipe design concernant les derniers prototypes. Focus sur les transitions et l'accessibilité du dashboard. Prévoir un compte-rendu immédiat.",
    category: 'work',
    iconType: 'call',
    action: { type: 'call', payload: '+33612345678', label: 'Appeler maintenant' },
    priority: 'critical',
    status: 'in_progress',
    scheduledAt: at(0, 9, 45),
    completedAt: undefined,
    garantId: '1',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '4',
    title: 'Mettre à jour la documentation',
    description: undefined,
    category: 'work',
    iconType: 'document',
    priority: 'medium',
    status: 'in_progress',
    scheduledAt: at(0, 11, 30),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '5',
    title: 'Vérifier les emails du matin',
    description: undefined,
    category: 'work',
    iconType: 'checklist',
    priority: 'low',
    status: 'completed',
    scheduledAt: at(0, 8, 30),
    completedAt: at(0, 8, 45),
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Demain (J+1)
  {
    id: '6',
    title: 'Appeler maman',
    description: undefined,
    category: 'personal',
    iconType: 'call',
    action: { type: 'call', payload: '+33611111111', label: 'Appeler maman' },
    priority: 'low',
    status: 'pending',
    scheduledAt: at(1, 19, 0),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Vendredi (J+2) — réunion vidéo, complétée
  {
    id: '7',
    title: 'Réunion équipe produit',
    description: "Point hebdo sur l'avancement",
    category: 'work',
    iconType: 'event',
    priority: 'high',
    status: 'completed',
    scheduledAt: at(2, 14, 0),
    completedAt: at(2, 14, 25),
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Samedi (J+3)
  {
    id: '8',
    title: 'Courses de la semaine',
    description: undefined,
    category: 'personal',
    iconType: 'checklist',
    priority: 'low',
    status: 'pending',
    scheduledAt: at(3, 10, 0),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },

  // ── Mois prochain — pour tester la vue Mois sur une autre semaine
  {
    id: '9',
    title: 'Préparer la présentation trimestrielle',
    description: undefined,
    category: 'work',
    iconType: 'document',
    priority: 'high',
    status: 'pending',
    scheduledAt: at(20, 9, 0),
    completedAt: undefined,
    garantId: undefined,
    createdAt: now,
    updatedAt: now,
  },
];

// Pour tester l'état vide, exporte un tableau vide à la place :
export const MOCK_TASKS_EMPTY: Task[] = [];

// ────────────────────────────────────────────────────────────────────────
// STATS — données mockées pour l'écran (stats)
// 30 jours d'historique bruts, du plus ancien au plus récent.
// Le hook useStatsData filtre cette base selon la période choisie (7j/30j/tout).
// TODO: remplacer par un vrai fetch API une fois l'endpoint /stats disponible
// ────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['D', 'L', 'M', 'Me', 'J', 'V', 'S']; // index = Date.getDay()

function buildMockDailyHistory(days: number) {
  const today = new Date();
  const history: {
    date: string;
    dayLabel: string;
    tasksCount: number;
    completionRate: number;
  }[] = [];

  // Pattern hebdo réaliste : forte en semaine, plus faible le week-end,
  // avec un peu de variation pour ne pas être parfaitement répétitif.
  const weekdayBase = [78, 85, 92, 97, 88, 45, 38]; // D L M Me J V S

  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const dow = d.getDay();
    const jitter = Math.floor(Math.sin(i * 1.7) * 8); // variation déterministe, pas random
    const completionRate = Math.max(20, Math.min(100, weekdayBase[dow] + jitter));
    const tasksCount = Math.max(1, Math.round((completionRate / 100) * 14));

    history.push({
      date: d.toISOString(),
      dayLabel: DAY_LABELS[dow],
      tasksCount,
      completionRate,
    });
  }

  return history;
}

export const MOCK_DAILY_HISTORY = buildMockDailyHistory(30);

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'work',     label: 'Work',     percentage: 45, color: '#FF6B1A' }, // Status.normal
  { category: 'personal', label: 'Perso',    percentage: 30, color: '#4D9EFF' }, // Status.guarantor
  { category: 'health',   label: 'Santé',    percentage: 15, color: '#00D68F' }, // Status.done
  { category: 'finance',  label: 'Finance',  percentage: 10, color: '#FFB800' }, // Status.urgent
];

export const MOCK_WEEKLY_GOAL = {
  title: 'Impact Maximal',
  description: 'Compléter 50 sessions de haute intensité',
  current: 42,
  target: 50,
};

export type { StatsCategory };
