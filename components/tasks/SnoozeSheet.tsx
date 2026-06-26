import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react-native';
import dayjs from 'dayjs';

import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { useTaskById, useTasksStore } from '@/stores/tasks.store';
import { useGarantsStore } from '@/stores/garants.store';
import { useAlarmStore } from '@/stores/alarm.store';
import { ICON_TYPE_ICON, ICON_TYPE_COLOR } from '@/utils/taskAction.utils';
import { dateUtils } from '@/utils/date.utils';

export interface SnoozeSheetHandle {
  present: (taskId: string) => void;
  dismiss: () => void;
}

interface SnoozeOption {
  minutes:    number | 'tomorrow';
  labelKey:   string;
  subKey:     string;
}

const SNOOZE_OPTIONS: SnoozeOption[] = [
  { minutes: 5,         labelKey: '+5 min',  subKey: 'brief' },
  { minutes: 15,        labelKey: '+15 min', subKey: 'standard' },
  { minutes: 30,        labelKey: '+30 min', subKey: 'long' },
  { minutes: 60,        labelKey: '+1h',     subKey: 'focus' },
  { minutes: 180,       labelKey: '+3h',     subKey: 'late' },
  { minutes: 'tomorrow', labelKey: 'tomorrow', subKey: 'morning' },
];

// Au-delà de ce seuil, le Garant lié à la tâche (s'il y en a un) est notifié
// du report — cohérent avec le rôle du Garant : suivre les engagements ratés.
const GARANT_NOTIFY_THRESHOLD_MIN = 30;

function computeNewTime(scheduledAt: string, option: SnoozeOption): Date {
  if (option.minutes === 'tomorrow') {
    return dayjs(scheduledAt).add(1, 'day').hour(9).minute(0).second(0).toDate();
  }
  return dayjs(scheduledAt).add(option.minutes, 'minute').toDate();
}

export const SnoozeSheet = forwardRef<SnoozeSheetHandle>((_, ref) => {
  const { t } = useTranslation('task');
  const sheetRef  = useRef<BottomSheetModal>(null);
  const taskIdRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<SnoozeOption>(SNOOZE_OPTIONS[1]);

  const [taskId, setTaskId] = useState<string | null>(null);
  const task        = useTaskById(taskId ?? undefined);
  const snoozeTask  = useTasksStore((s) => s.snoozeTask);
  const garants     = useGarantsStore((s) => s.garants);
  const alarmSnooze = useAlarmStore((s) => s.snooze);
  const alarmDismiss = useAlarmStore((s) => s.dismiss);

  const garant = task?.garantId ? garants.find((g) => g.id === task.garantId) : undefined;

  useImperativeHandle(ref, () => ({
    present: (id) => {
      taskIdRef.current = id;
      setTaskId(id);
      setSelected(SNOOZE_OPTIONS[1]);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const newTime = useMemo(() => {
    if (!task) return null;
    return computeNewTime(task.scheduledAt, selected);
  }, [task, selected]);

  const delayMinutes = selected.minutes === 'tomorrow' ? Infinity : selected.minutes;
  const willNotifyGarant = !!garant && delayMinutes > GARANT_NOTIFY_THRESHOLD_MIN;

  function handleConfirm() {
    if (!task || !newTime) return;
    snoozeTask(task.id, newTime.toISOString());
    alarmSnooze();
    alarmDismiss();
    sheetRef.current?.dismiss();
  }

  const ActionIcon = task ? ICON_TYPE_ICON[task.iconType] : Clock;
  const actionColor = task ? ICON_TYPE_COLOR[task.iconType] : '#8BA3BE';

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['68%']}
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
      backgroundStyle={{ backgroundColor: '#121E2E' }}
      handleIndicatorStyle={{ backgroundColor: '#2A4560' }}
    >
      <BottomSheetView className="px-[20px] pt-[8px] pb-[24px]">
        <Text className="font-space-bold text-display-s text-text-primary mb-[16px]">
          ⏰ {t('snooze.title')}
        </Text>

        {task && (
          <View
            className="flex-row items-center gap-[12px] bg-deep rounded-2xl px-[14px] py-[12px] mb-[20px] border-l-[3px]"
            style={{ borderLeftColor: actionColor }}
          >
            <IconBadge icon={ActionIcon} color={actionColor} size={36} iconSize={16} radius={11} />
            <View className="flex-1">
              <Text className="font-inter-medium text-caption text-text-muted uppercase tracking-widest">
                {t('snooze.currentTask')}
              </Text>
              <Text className="font-inter-semibold text-body-m text-text-primary" numberOfLines={1}>
                {task.title}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row flex-wrap gap-[10px] mb-[20px]">
          {SNOOZE_OPTIONS.map((opt) => {
            const active = selected.subKey === opt.subKey;
            return (
              <Pressable
                key={opt.subKey}
                onPress={() => setSelected(opt)}
                className="rounded-2xl px-[14px] py-[12px] border"
                style={{
                  width: '31%',
                  backgroundColor: active ? 'rgba(255,107,26,0.10)' : '#0D1520',
                  borderColor:     active ? '#FF6B1A' : '#1E3048',
                  borderWidth:     active ? 1.5 : 1,
                }}
              >
                <Text
                  className="font-inter-semibold text-body-m"
                  style={{ color: active ? '#FF6B1A' : '#F0F6FF', includeFontPadding: false }}
                >
                  {opt.minutes === 'tomorrow' ? t('snooze.tomorrow') : opt.labelKey}
                </Text>
                <Text
                  className="font-inter-regular text-caption uppercase tracking-widest mt-[2px]"
                  style={{ color: active ? '#FF6B1A' : '#4A6480' }}
                >
                  {t(`snooze.options.${opt.subKey}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
          {t('snooze.preciseTime')}
        </Text>
        <View
          className="flex-row items-center gap-[10px] rounded-[14px] px-[16px] mb-[20px]"
          style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
        >
          <Clock size={16} color="#4A6480" strokeWidth={1.8} />
          <Text className="font-inter-medium text-body-m text-text-secondary">
            {newTime ? dateUtils.formatTime(newTime.toISOString()) : '--:--'}
          </Text>
        </View>

        {willNotifyGarant && (
          <View
            className="flex-row items-start gap-[10px] rounded-2xl px-[14px] py-[12px] mb-[20px] border"
            style={{ backgroundColor: 'rgba(255,184,0,0.08)', borderColor: 'rgba(255,184,0,0.25)' }}
          >
            <AlertTriangle size={16} color="#FFB800" strokeWidth={1.8} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-inter-regular text-body-s text-warning leading-[20px]">
              {t('snooze.garantWarning', { name: garant?.firstName })}
            </Text>
          </View>
        )}

        <Button
          label={t('snooze.confirm')}
          variant="primary"
          size="l"
          fullWidth
          onPress={handleConfirm}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

SnoozeSheet.displayName = 'SnoozeSheet';
