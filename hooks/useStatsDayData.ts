import { useMemo } from 'react';
import { MOCK_DAILY_HISTORY, MOCK_TASKS } from '@/constants/mock';
import { dateKey } from '@/utils/date.utils';
import type { DailyStatsDetail, AiInsightSegment } from '@/types/stats.types';

interface UseStatsDayDataResult {
  data: DailyStatsDetail | null;
  isLoading: boolean;
  isError: boolean;
}

/** Insight IA mocké, qui varie un minimum selon la performance du jour. */
function buildMockAiInsight(completionRate: number): AiInsightSegment[] {
  if (completionRate >= 80) {
    return [
      { text: 'Vous êtes ' },
      { text: `${completionRate}% plus productif`, emphasis: true },
      { text: ' avec ' },
      { text: '4 tâches ou moins', emphasis: true },
      { text: ' le matin. Conservez cette dynamique pour les prochains jours !' },
    ];
  }
  if (completionRate >= 50) {
    return [
      { text: 'Une journée ' },
      { text: 'dans la moyenne', emphasis: true },
      { text: '. Regrouper vos tâches prioritaires en début de matinée pourrait faire la différence demain.' },
    ];
  }
  return [
    { text: 'Journée plus ' },
    { text: 'chargée que d\u2019habitude', emphasis: true },
    { text: '. Une seule journée ne casse pas une bonne dynamique — on repart demain.' },
  ];
}

/**
 * TODO: remplacer par un vrai fetch (Supabase / API) une fois le backend prêt.
 * En attendant, on dérive le détail du jour depuis MOCK_DAILY_HISTORY
 * (taux + volume) et MOCK_TASKS (tâches réellement complétées ce jour-là),
 * pour que chaque jour tapé affiche des données différentes plutôt que
 * toujours le même mock statique.
 *
 * L'insight IA est un contenu généré, pas une string statique : il n'a pas
 * sa place dans les fichiers de traduction, il arrivera déjà localisé
 * depuis le backend selon la langue de l'utilisateur.
 */
export function useStatsDayData(date: string | undefined): UseStatsDayDataResult {
  const data = useMemo<DailyStatsDetail | null>(() => {
    if (!date) return null;

    const entry = MOCK_DAILY_HISTORY.find((d) => dateKey(new Date(d.date)) === date);
    if (!entry) return null;

    const tasksTotal     = entry.tasksCount;
    const tasksCompleted = Math.round((entry.completionRate / 100) * tasksTotal);

    const tasksThatDay = MOCK_TASKS.filter(
      (task) => dateKey(new Date(task.scheduledAt)) === date,
    );

    const completedTasks = tasksThatDay
      .filter((task) => task.status === 'completed')
      .map((task) => ({
        id: task.id,
        title: task.title,
        time: new Date(task.scheduledAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));

    const urgentManaged = tasksThatDay.filter(
      (task) => task.priority === 'high' && task.status === 'completed',
    ).length;

    return {
      date,
      completionRate: entry.completionRate,
      tasksCompleted,
      tasksTotal,
      // TODO: calcul réel à brancher (ex: tâches groupées, automatisations déclenchées)
      timeSavedMinutes: Math.round(entry.completionRate * 1.8),
      // TODO: brancher sur le vrai delta de streak renvoyé par le backend
      streakDelta: entry.completionRate >= 70 ? 1 : entry.completionRate >= 40 ? 0 : -1,
      urgentManaged,
      aiInsight: buildMockAiInsight(entry.completionRate),
      completedTasks,
    };
  }, [date]);

  const isError = Boolean(date) && data === null;

  return { data, isLoading: false, isError };
}