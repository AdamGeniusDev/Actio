import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type {
  StatsData,
  StatsPeriod,
  ActivityDay,
  RecentActivityEntry,
} from '@/types/stats.types';
import {
  MOCK_DAILY_HISTORY,
  MOCK_CATEGORY_BREAKDOWN,
  MOCK_WEEKLY_GOAL,
} from '@/constants/mock';

const PERIOD_TO_DAYS: Record<StatsPeriod, number> = {
  '7j': 7,
  '30j': 30,
  'tout': 30, // pas plus de mock disponible ; un vrai backend renverrait tout l'historique
};

// Nombre d'entrées affichées dans "Récent" — varie avec la période pour que le
// toggle ait un effet visible même si les jours les plus récents restent
// forcément les mêmes (toutes les fenêtres se terminent à aujourd'hui).
const PERIOD_TO_RECENT_COUNT: Record<StatsPeriod, number> = {
  '7j': 5,
  '30j': 10,
  'tout': 10,
};

type DailyHistoryEntry = (typeof MOCK_DAILY_HISTORY)[number];

function formatRecentDateLabel(iso: string): string {
  const d = dayjs(iso);
  const today = dayjs().startOf('day');
  const diff = today.diff(d.startOf('day'), 'day');
  if (diff === 0) return `Aujourd'hui, ${d.format('D MMM')}`;
  if (diff === 1) return `Hier, ${d.format('D MMM')}`;
  return d.format('dddd D MMM');
}

/**
 * Regroupe une liste de jours (chronologique, du plus ancien au plus récent)
 * en buckets de 7 jours, alignés depuis la fin (aujourd'hui) vers le début.
 * Le bucket le plus récent est donc toujours une semaine complète se terminant
 * aujourd'hui ; le plus ancien peut être partiel si le total n'est pas un
 * multiple de 7 (normal avec les 30 jours de mock — disparaît avec un vrai
 * historique backend illimité).
 */
function aggregateIntoWeeks(days: DailyHistoryEntry[]): ActivityDay[] {
  const buckets: ActivityDay[] = [];
  let end = days.length;
  let offset = 0;

  while (end > 0) {
    const start = Math.max(0, end - 7);
    const chunk = days.slice(start, end);

    const avgRate    = Math.round(chunk.reduce((s, d) => s + d.completionRate, 0) / chunk.length);
    const totalTasks = chunk.reduce((s, d) => s + d.tasksCount, 0);

    buckets.unshift({
      date: chunk[chunk.length - 1].date, // dernier jour du bucket, gardé pour référence
      dayLabel: '',
      completionRate: avgRate,
      tasksCount: totalTasks,
      granularity: 'week',
      weekOffset: -offset,
    });

    end = start;
    offset++;
  }

  return buckets;
}

/**
 * Construit le StatsData à partir de la fenêtre de jours sélectionnée.
 * TODO: remplacer ce calcul local par la réponse de GET /stats?period={period}
 * une fois l'endpoint backend disponible — la forme de StatsData ne devrait pas changer,
 * donc aucun composant n'aura besoin d'être modifié.
 */
function buildStatsData(period: StatsPeriod): StatsData {
  const windowSize = PERIOD_TO_DAYS[period];
  const slice = MOCK_DAILY_HISTORY.slice(-windowSize);

  const tasksCompleted = slice.reduce((sum, d) => sum + d.tasksCount, 0);
  const averageScore = Math.round(
    slice.reduce((sum, d) => sum + d.completionRate, 0) / slice.length
  );

  // Streak: nombre de jours consécutifs (en partant d'aujourd'hui) avec completionRate >= 70
  // Indépendant de la période choisie — un streak est un état global, pas une vue filtrée.
  let currentStreak = 0;
  for (let i = MOCK_DAILY_HISTORY.length - 1; i >= 0; i--) {
    if (MOCK_DAILY_HISTORY[i].completionRate >= 70) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Focus moyen mocké, dérivé du score moyen pour rester cohérent visuellement
  const averageFocusHours = Math.round((2.5 + (averageScore / 100) * 2.5) * 10) / 10;

  // 7j → granularité jour (comportement historique). 30j/tout → agrégation
  // hebdomadaire, sinon on afficherait 30 micro-barres illisibles dans la card.
  const activity: ActivityDay[] = period === '7j'
    ? slice.map((d) => ({
        date: d.date,
        dayLabel: d.dayLabel,
        completionRate: d.completionRate,
        tasksCount: d.tasksCount,
        granularity: 'day',
      }))
    : aggregateIntoWeeks(slice);

  const recentCount = PERIOD_TO_RECENT_COUNT[period];
  const recent: RecentActivityEntry[] = [...slice]
    .reverse()
    .slice(0, recentCount)
    .map((d) => ({
      date: d.date,
      dateLabel: formatRecentDateLabel(d.date),
      tasksCount: d.tasksCount,
      completionRate: d.completionRate,
    }));

  return {
    overview: {
      averageScore,
      tasksCompleted,
      currentStreak,
      averageFocusHours,
    },
    weeklyGoal: MOCK_WEEKLY_GOAL,
    activity,
    breakdown: MOCK_CATEGORY_BREAKDOWN,
    recent,
  };
}

interface UseStatsDataOptions {
  period: StatsPeriod;
}

export function useStatsData({ period }: UseStatsDataOptions) {
  return useQuery({
    queryKey: ['stats', 'overview', period],
    queryFn: async (): Promise<StatsData> => {
      // TODO: brancher l'appel API réel ici, ex:
      // const res = await apiClient.get<ApiResponse<StatsData>>(`/stats?period=${period}`);
      // return res.data;
      return buildStatsData(period);
    },
    staleTime: 2 * 60 * 1000, // cohérent avec queryClient.ts (staleTime=2min)
  });
}