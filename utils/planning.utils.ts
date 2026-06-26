import { addDays, startOfWeek, dateKey } from '@/utils/date.utils';
import type { Task } from '@/types/task.types';

/**
 * Construit la grille du mois (tableau de semaines de 7 jours),
 * en incluant les jours du mois précédent/suivant pour compléter les lignes.
 */
export function buildMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let cur        = startOfWeek(firstDay);
  const weeks: Date[][] = [];

  while (cur <= lastDay || weeks.length < 4) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    weeks.push(week);
    if (cur > lastDay && weeks.length >= 4) break;
  }
  return weeks;
}

/** Regroupe les tâches par jour (clé 'YYYY-MM-DD' → tâches du jour). */
export function groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.scheduledAt.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), task]);
  }
  return map;
}

/**
 * Détermine la couleur des points de densité pour un jour donné :
 * rouge = tâche en retard, vert = tout complété, orange = en attente.
 */
export function resolveDotColor(tasks: Task[], inMonth = true): string {
  if (!inMonth) return '#1E3048';
  const now     = new Date();
  const hasLate = tasks.some(task => task.status !== 'completed' && new Date(task.scheduledAt) < now);
  const hasDone = tasks.some(task => task.status === 'completed');
  return hasLate ? '#FF3B5C' : hasDone ? '#00D68F' : '#FF6B1A';
}

/** Construit le libellé d'en-tête de section : "MERCREDI 17 JUIN". */
export function buildDayLabel(day: Date, daysFull: string[], months: string[]): string {
  return `${daysFull[day.getDay()].toUpperCase()} ${day.getDate()} ${months[day.getMonth()].toUpperCase()}`;
}

/** Stats agrégées de la semaine (total, taux de complétion, streak). */
export function computeWeekStats(weekDays: Date[], taskMap: Map<string, Task[]>) {
  const all       = weekDays.flatMap(d => taskMap.get(dateKey(d)) ?? []);
  const total     = all.length;
  const completed = all.filter(task => task.status === 'completed').length;
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, rate, streak: 7 }; // TODO: streak réel depuis l'historique
}