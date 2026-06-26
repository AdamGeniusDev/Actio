export type StatsPeriod = '7j' | '30j' | 'tout';

export interface StatsOverview {
  averageScore: number;       // pourcentage, ex. 87
  tasksCompleted: number;
  currentStreak: number;      // jours consécutifs
  averageFocusHours: number;  // ex. 4.2
}

export interface WeeklyGoal {
  title: string;
  description: string;
  current: number;
  target: number;
}

export interface ActivityDay {
  date: string;        // ISO date
  dayLabel: string;    // 'L', 'M', 'Me', 'J', 'V', 'S', 'D' en granularité jour ; '' en granularité semaine
  completionRate: number; // 0-100, sert à la hauteur de la barre
  tasksCount: number;
  /** Granularité de cette barre. Absent = 'day' (rétrocompatible). */
  granularity?: 'day' | 'week';
  /** Uniquement pour granularity 'week' : 0 = semaine en cours, -1 = semaine précédente, etc. */
  weekOffset?: number;
}

export type StatsCategory = 'work' | 'personal' | 'health' | 'finance';

export interface CategoryBreakdown {
  category: StatsCategory;
  label: string;
  percentage: number; // doit sommer à 100 sur l'ensemble
  color: string;
}

export interface RecentActivityEntry {
  date: string;          // ISO date
  dateLabel: string;      // "Aujourd'hui, 24 Oct"
  tasksCount: number;
  completionRate: number; // 0-100
}

export interface StatsData {
  overview: StatsOverview;
  weeklyGoal: WeeklyGoal;
  activity: ActivityDay[];
  breakdown: CategoryBreakdown[];
  recent: RecentActivityEntry[];
}

// ─── Détail jour (/stats/[date]) ──────────────────────────────────────────

/** Segment de texte pour l'insight IA — permet de mettre en valeur certains passages. */
export interface AiInsightSegment {
  text: string;
  emphasis?: boolean;
}

export interface CompletedTaskEntry {
  id: string;
  title: string;
  time: string; // 'HH:mm'
}

export interface DailyStatsDetail {
  date: string; // 'YYYY-MM-DD'
  completionRate: number;     // 0-100
  tasksCompleted: number;
  tasksTotal: number;
  timeSavedMinutes: number;   // temps économisé estimé (ex: tâches groupées, automatisations)
  streakDelta: number;        // variation du streak ce jour-là (+1, 0, -1…)
  urgentManaged: number;      // nb de tâches urgentes traitées
  aiInsight: AiInsightSegment[];
  completedTasks: CompletedTaskEntry[];
}