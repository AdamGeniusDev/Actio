// ▶ expo-notifications — module natif, nécessite un build development pour
// être testé (même limitation que dans (onboarding)/permissions.tsx et
// (settings)/permissions.tsx). Décommenter tout ce fichier une fois le
// rebuild natif fait, et supprimer les stubs no-op en bas.
//
// import * as Notifications from 'expo-notifications';
//
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge:  true,
//     shouldShowBanner: true,
//     shouldShowList:  true,
//   }),
// });
//
// export async function scheduleTaskAlarm(
//   taskId:      string,
//   title:       string,
//   scheduledAt: Date,
// ): Promise<string> {
//   return Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Il est l'heure",
//       body:  title,
//       data:  { taskId, type: 'alarm' },
//     },
//     trigger: {
//       type: Notifications.SchedulableTriggerInputTypes.DATE,
//       date: scheduledAt,
//     },
//   });
// }
//
// export async function cancelAlarm(id: string): Promise<void> {
//   await Notifications.cancelScheduledNotificationAsync(id);
// }

// ── Stubs no-op — actifs tant qu'on n'est pas en build development ──────────
// Mêmes signatures que la vraie implémentation ci-dessus, pour que le code
// appelant (stores/tasks.store.ts, app/_layout.tsx) compile et fonctionne
// sans modification une fois le rebuild fait — il suffira de supprimer ces
// stubs et décommenter le bloc au-dessus.

export async function scheduleTaskAlarm(
  _taskId:      string,
  _title:       string,
  _scheduledAt: Date,
): Promise<string> {
  return '';
}

export async function cancelAlarm(_id: string): Promise<void> {}
