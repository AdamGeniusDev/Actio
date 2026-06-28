import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_TASKS } from '@/constants/mock';
import { scheduleTaskAlarm, cancelAlarm } from '@/lib/notifications';
import { notificationsApi } from '@/lib/api/notificationsApi';
import { resolveChannelAndContact, buildAlertMessage } from '@/lib/garantNotifications';
import { useGarantsStore } from '@/stores/garants.store';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types/task.types';

interface TasksState {
  tasks:        Task[];
  addTask:      (dto: CreateTaskDTO) => Task;
  updateTask:   (id: string, patch: UpdateTaskDTO) => void;
  removeTask:   (id: string) => void;
  completeTask: (id: string) => void;
  snoozeTask:   (id: string, newScheduledAt: string) => void;
}

// Notification OS programmée par tâche, en mémoire (pas critique tant que
// scheduleTaskAlarm reste un stub hors build development).
const scheduledAlarmIds = new Map<string, string>();

// Une tâche par lieu n'a pas d'heure fixe : son déclenchement passe par le
// geofencing (TODO [API]), pas par une notification programmée.
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

// Best-effort, asynchrone, après l'écriture locale — une panne réseau ne
// bloque jamais l'app, mais l'alerte n'est alors simplement jamais
// programmée (pas de file de réessai pour l'instant).
async function syncGarantNotification(task: Task) {
  const setNotificationId = useTasksStore.getState()._setNotificationId;

  if (!task.garantId || task.status === 'completed') {
    if (task.notificationId) {
      await notificationsApi.cancel(task.notificationId).catch(() => {});
      setNotificationId(task.id, undefined);
    }
    return;
  }

  const garant = useGarantsStore.getState().garants.find((g) => g.id === task.garantId);
  const resolved = garant ? resolveChannelAndContact(garant) : null;

  if (!garant || !resolved) {
    // On prévient plutôt que d'échouer silencieusement sur une fonctionnalité de sécurité.
    useUIStore.getState().addToast({
      message: "Impossible de programmer l'alerte Garant pour cette tâche (contact manquant).",
      type: 'warning',
    });
    return;
  }

  const userFirstName = useAuthStore.getState().user?.firstName ?? 'Quelqu\'un';
  const message = buildAlertMessage(task.title, userFirstName);

  try {
    if (task.notificationId) {
      await notificationsApi.update(task.notificationId, { scheduledAt: task.scheduledAt, message });
    } else {
      const created = await notificationsApi.create({
        clientTaskId: task.id,
        garantContact: resolved.contact,
        channel: resolved.channel,
        message,
        scheduledAt: task.scheduledAt,
      });
      setNotificationId(task.id, created.id);
    }
  } catch {
    useUIStore.getState().addToast({
      message: "L'alerte Garant n'a pas pu être synchronisée (vérifiez votre connexion).",
      type: 'warning',
    });
  }
}

// Les tâches restent 100% locales (architecture local-first) — seule
// l'alerte Garant associée est synchronisée (syncGarantNotification ci-dessus).
export const useTasksStore = create<TasksState & { _setNotificationId: (taskId: string, notificationId: string | undefined) => void }>()(
  persist(
    (set) => ({
      tasks: MOCK_TASKS,

      _setNotificationId: (taskId, notificationId) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, notificationId } : t)),
      })),

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
        syncGarantNotification(task).catch(() => {});
        return task;
      },

      updateTask: (id, patch) => set((state) => {
        const tasks = state.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
        );
        const updated = tasks.find((t) => t.id === id);
        if (updated) {
          syncAlarmForTask(updated);
          syncGarantNotification(updated).catch(() => {});
        }
        return { tasks };
      }),

      removeTask: (id) => {
        clearAlarmForTask(id);
        const task = useTasksStore.getState().tasks.find((t) => t.id === id);
        if (task?.notificationId) {
          notificationsApi.cancel(task.notificationId).catch(() => {});
        }
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      completeTask: (id) => {
        clearAlarmForTask(id);
        set((state) => {
          const tasks = state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : t,
          );
          const updated = tasks.find((t) => t.id === id);
          if (updated) syncGarantNotification(updated).catch(() => {});
          return { tasks };
        });
      },

      snoozeTask: (id, newScheduledAt) => set((state) => {
        const tasks = state.tasks.map((t) =>
          t.id === id
            ? { ...t, status: 'snoozed' as const, scheduledAt: newScheduledAt, updatedAt: new Date().toISOString() }
            : t,
        );
        const updated = tasks.find((t) => t.id === id);
        if (updated) {
          syncAlarmForTask(updated);
          syncGarantNotification(updated).catch(() => {});
        }
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
