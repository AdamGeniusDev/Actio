export const QUERY_KEYS = {
  tasks: {
    all:    ['tasks'] as const,
    today:  ()           => ['tasks', 'today'] as const,
    week:   ()           => ['tasks', 'week']  as const,
    detail: (id: string) => ['tasks', id]      as const,
  },
  garants: {
    all:    ['garants'] as const,
    detail: (id: string) => ['garants', id] as const,
  },
  stats: {
    all: ['stats'] as const,
    day: (date: string) => ['stats', date] as const,
  },
  user: { me: ['user', 'me'] as const },
  auth: { session: ['auth', 'session'] as const },
  subscriptions: { status: ['subscriptions', 'status'] as const },
} as const;
