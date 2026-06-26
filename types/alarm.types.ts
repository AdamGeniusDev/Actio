export type AlarmState = 'idle' | 'ringing';

export interface AlarmConfig {
  taskId:      string;
  snoozeCount: number;
  maxSnooze:   number;
}
