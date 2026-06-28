// Type d'icône — purement visuel, choisi dans la grille "Type d'action" du
// formulaire de création. Ne dit rien sur le comportement : une tâche
// 'event' peut très bien avoir (ou non) un bouton d'action directe (cf.
// TaskAction ci-dessous), tout comme une tâche 'call'.
export type TaskIconType =
  | 'call'      // 📞
  | 'message'   // 💬
  | 'document'  // 📄
  | 'payment'   // 💰
  | 'event'     // 📅
  | 'checklist' // ✅
  | 'goal';     // 🎯

// Action exécutable, optionnelle et indépendante de l'icône — détermine le
// bouton "Appeler maintenant" / "Rejoindre le call" affiché sur le détail et
// l'écran d'alarme. Une tâche sans action n'affiche aucun bouton direct.
export type TaskActionExecType = 'call' | 'open_url' | 'whatsapp' | 'email';

export interface TaskAction {
  type:    TaskActionExecType;
  payload: string;   // numéro de téléphone, URL, email selon le type
  label:   string;    // texte du bouton affiché, ex: "Appeler Dr. Kofi"
}

// ─── Localisation (Pro) ───────────────────────────────────────────────────────
// Le déclenchement réel (geofencing en arrière-plan) est une brique
// backend/native à part — voir TODO [API] dans le picker associé.

export interface TaskLocation {
  label:        string;  // adresse ou nom du lieu, affiché à l'utilisateur
  latitude:     number;
  longitude:    number;
  radiusMeters: number;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskCategory = 'work' | 'personal' | 'health';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus   = 'pending' | 'in_progress' | 'completed' | 'snoozed' | 'failed';

export interface Task {
  id:           string;
  title:        string;
  description?: string;
  category:     TaskCategory;
  iconType:     TaskIconType;
  priority:     TaskPriority;
  status:       TaskStatus;
  scheduledAt:  string;        // ISO string
  completedAt?: string;
  garantId?:    string;
  // Id de l'alerte programmée côté backend (cf. lib/api/notificationsApi.ts)
  // — posé après coup, de façon asynchrone, par la synchronisation dans
  // tasks.store.ts. Jamais fourni par l'utilisateur (absent de CreateTaskDTO).
  notificationId?: string;
  action?:      TaskAction;    // ← optionnel, indépendant de iconType
  location?:    TaskLocation;  // ← Pro uniquement
  createdAt:    string;
  updatedAt:    string;
}

export interface CreateTaskDTO {
  title:        string;
  description?: string;
  category:     TaskCategory;
  iconType:     TaskIconType;
  priority:     TaskPriority;
  scheduledAt:  string;
  garantId?:    string;
  action?:      TaskAction;
  location?:    TaskLocation;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
}
