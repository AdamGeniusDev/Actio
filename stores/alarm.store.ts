import { create } from 'zustand';
import type { AlarmConfig, AlarmState } from '@/types/alarm.types';

interface AlarmStoreState {
  state:   AlarmState;
  config:  AlarmConfig | null;
  ring:    (taskId: string, maxSnooze?: number) => void;
  snooze:  () => void; // incrémente le compteur — la replanification réelle de la tâche est gérée par l'appelant (useTasksStore)
  dismiss: () => void;
}

export const useAlarmStore = create<AlarmStoreState>((set) => ({
  state:  'idle',
  config: null,
  ring:   (taskId, maxSnooze = 3) => set({ state: 'ringing', config: { taskId, snoozeCount: 0, maxSnooze } }),
  snooze: () => set((s) => ({
    config: s.config ? { ...s.config, snoozeCount: s.config.snoozeCount + 1 } : null,
  })),
  dismiss: () => set({ state: 'idle', config: null }),
}));
