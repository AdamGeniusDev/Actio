import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_TASKS } from '@/constants/mock';
import { scheduleTaskAlarm, cancelAlarm } from '@/lib/notifications';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types/task.types';

interface TasksState {
  tasks:        Task[];
  addTask:      (dto: CreateTaskDTO) => Task;
  updateTask:   (id: string, patch: UpdateTaskDTO) => void;
  removeTask:   (id: string) => void;
  completeTask: (id: string) => void;
  snoozeTask:   (id: string, newScheduledAt: string) => void;
}

// Notification OS programmée par tâche — en mémoire seulement (pas persisté,
// pas critique : tant qu'on n'est pas en build development, scheduleTaskAlarm
// est un stub qui ne fait rien, donc cette table reste vide de toute façon).
const scheduledAlarmIds = new Map<string, string>();

// Une tâche par lieu n'a pas d'heure de sonnerie fixe — son déclenchement
// réel passera par le geofencing (TODO [API], backend/natif séparé), pas par
// une notification programmée à une date précise.
function syncAlarmForTask(task: Task) {
  const previousId = scheduledAlarmIds.get(task.id);
  if (previousId) {
    cancelAlarm(previousId).catch(() => {});
    scheduledAlarmIds.delete(task.id);
  }

  if (task.location || task.status === 'completed') return;

  scheduleTaskAlarm(task.id, task.title, new Date(task.scheduledAt))
    .then((notifId) => {
      if (notifId) scheduledAlarmIds.set(task.id, notifId);
    })
    .catch(() => {});
}

function clearAlarmForTask(taskId: string) {
  const previousId = scheduledAlarmIds.get(taskId);
  if (previousId) {
    cancelAlarm(previousId).catch(() => {});
    scheduledAlarmIds.delete(taskId);
  }
}

// TODO [API]: remplacer ce store en mémoire par des requêtes au backend Hono
// + synchronisation après chaque mutation. Pour l'instant tout vit en local —
// un refresh de l'app réinitialise les données mock si jamais vidées.
export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: MOCK_TASKS,

      addTask: (dto) => {
        const now = new Date().toISOString();
        const task: Task = {
          ...dto,
          id:        Date.now().toString(),
          status:    'pending',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        syncAlarmForTask(task);
        return task;
      },

      updateTask: (id, patch) => set((state) => {
        const tasks = state.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
        );
        const updated = tasks.find((t) => t.id === id);
        if (updated) syncAlarmForTask(updated);
        return { tasks };
      }),

      removeTask: (id) => {
        clearAlarmForTask(id);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      completeTask: (id) => {
        clearAlarmForTask(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t,
          ),
        }));
      },

      snoozeTask: (id, newScheduledAt) => set((state) => {
        const tasks = state.tasks.map((t) =>
          t.id === id
            ? { ...t, status: 'snoozed' as const, scheduledAt: newScheduledAt, updatedAt: new Date().toISOString() }
            : t,
        );
        const updated = tasks.find((t) => t.id === id);
        if (updated) syncAlarmForTask(updated);
        return { tasks };
      }),
    }),
    {
      name:    'actio-tasks',
      // ── Couche storage ──────────────────────────────────────────────────
      //
      // ▶ MMKV — activer en prod (rebuild natif requis)
      //
      // import { mmkvStorage } from '@/lib/mmkvStorage';
      // storage: createJSONStorage(() => mmkvStorage),
      //
      // ▶ AsyncStorage — actif pour l'instant (Expo Go / dev sans rebuild)
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
);

export function useTaskById(id: string | undefined): Task | undefined {
  return useTasksStore((s) => (id ? s.tasks.find((t) => t.id === id) : undefined));
}
