import { create } from 'zustand';
import type { CreateTaskDTO } from '@/types/task.types';

export interface Toast {
  id:      string;
  message: string;
  type:    'success' | 'error' | 'info' | 'warning';
}

// Pré-remplissage partiel passé à TaskCreationSheet — utilisé par le flux
// "Créer avec l'IA" pour transmettre le résultat détecté avant édition manuelle.
export type TaskDraft = Partial<CreateTaskDTO>;

interface UIState {
  toasts:        Toast[];
  isLoading:     boolean;
  taskSheetOpen: boolean;
  taskDraft:     TaskDraft | null;
  addToast:      (t: Omit<Toast, 'id'>) => void;
  removeToast:   (id: string) => void;
  setLoading:    (l: boolean) => void;
  openTaskSheet: (draft?: TaskDraft) => void;
  closeTaskSheet: () => void;
}

export const useUIStore = create<UIState>(set => ({
  toasts:        [],
  isLoading:     false,
  taskSheetOpen: false,
  taskDraft:     null,
  addToast:       t    => set(s => ({ toasts: [...s.toasts, { ...t, id: Date.now().toString() }] })),
  removeToast:    id   => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  setLoading:     l    => set({ isLoading: l }),
  openTaskSheet:  draft => set({ taskSheetOpen: true, taskDraft: draft ?? null }),
  closeTaskSheet: ()    => set({ taskSheetOpen: false, taskDraft: null }),
}));
