import { useRef } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Video, Shield } from 'lucide-react-native';

import { Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { IconBadge } from '@/components/ui/IconBadge';
import { Button } from '@/components/ui/Button';
import { TaskEditSheet, type TaskEditSheetHandle } from '@/components/tasks/TaskEditSheet';
import { useTaskById, useTasksStore } from '@/stores/tasks.store';
import { useGarantsStore } from '@/stores/garants.store';
import { ICON_TYPE_ICON, ICON_TYPE_COLOR, buildActionUrl } from '@/utils/taskAction.utils';
import { dateUtils } from '@/utils/date.utils';
import type { Task } from '@/types/task.types';

const STATUS_BADGE: Record<Task['status'], { variant: 'accent' | 'success' | 'danger' | 'ghost' | 'info'; key: string }> = {
  pending:     { variant: 'ghost',   key: 'pending' },
  in_progress: { variant: 'accent',  key: 'inProgress' },
  completed:   { variant: 'success', key: 'completed' },
  snoozed:     { variant: 'info',    key: 'snoozed' },
  failed:      { variant: 'danger',  key: 'failed' },
};

// ─── HistoryEntry ─────────────────────────────────────────────────────────────
// Reconstitué à partir des champs réels de la tâche (createdAt/updatedAt/status)
// — il n'existe pas encore de vrai journal d'événements côté backend.
// TODO [API]: remplacer par un historique persisté une fois le backend prêt.

function HistoryEntry({
  label, time, color, isLast,
}: { label: string; time: string; color: string; isLast?: boolean }) {
  return (
    <View className="flex-row gap-[12px]">
      <View className="items-center">
        <View className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: color }} />
        {!isLast && <View className="w-px flex-1 my-[4px]" style={{ backgroundColor: '#1E3048' }} />}
      </View>
      <View style={{ paddingBottom: isLast ? 0 : 20 }}>
        <Text className="font-inter-medium text-body-s text-text-primary">{label}</Text>
        <Text className="font-inter-regular text-caption text-text-muted mt-[2px]">{time}</Text>
      </View>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const { t }       = useTranslation('task');
  const { t: tG }   = useTranslation('garants');

  const task          = useTaskById(taskId);
  const completeTask  = useTasksStore((s) => s.completeTask);
  const garants       = useGarantsStore((s) => s.garants);
  const garant        = task?.garantId ? garants.find((g) => g.id === task.garantId) : undefined;

  const editSheetRef = useRef<TaskEditSheetHandle>(null);

  if (!task) {
    return (
      <SafeScreenView withGradient>
        <ScreenHeader title={t('detail.notFound')} showBack />
      </SafeScreenView>
    );
  }

  const Icon = ICON_TYPE_ICON[task.iconType];
  const iconColor = ICON_TYPE_COLOR[task.iconType];
  const statusBadge = STATUS_BADGE[task.status];
  const isVideoMeeting = task.iconType === 'event' && !!task.action;

  // Le Garant est considéré "notifié" si la tâche est en cours/reportée et que
  // le délai d'alerte configuré est déjà dépassé — proxy local, pas un vrai log.
  const garantNotified = !!garant
    && (task.status === 'in_progress' || task.status === 'snoozed')
    && Date.now() - new Date(task.scheduledAt).getTime() > garant.alertDelayMinutes * 60_000;

  async function handlePrimaryAction() {
    if (!task || !task.action) return;
    try { await Linking.openURL(buildActionUrl(task.action)); } catch {}
  }

  return (
    <SafeScreenView withGradient>
      <View className="flex-row items-center justify-between px-[20px] py-[16px]">
        <BackButton onPress={() => router.back()} />
        <Badge label={t(`detail.status.${statusBadge.key}`)} variant={statusBadge.variant} />
        <Pressable onPress={() => editSheetRef.current?.present(task.id)} hitSlop={8}>
          <Text className="font-inter-semibold text-body-m text-accent">
            {t('detail.edit')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48 }}
      >
        {/* ── Carte tâche ──────────────────────────────────────────────────── */}
        <View
          className="flex-row items-start gap-[14px] bg-card rounded-2xl px-[16px] py-[16px] mb-[24px] border-l-[3px]"
          style={[{ borderLeftColor: iconColor }, Shadows.card]}
        >
          <IconBadge icon={Icon} color={iconColor} size={44} iconSize={20} radius={14} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-body-l text-text-primary">{task.title}</Text>
            <Text className="font-inter-regular text-body-s text-text-muted mt-[4px]">
              {dateUtils.formatDisplay(task.scheduledAt)} · {dateUtils.formatTime(task.scheduledAt)}
            </Text>
          </View>
        </View>

        {/* ── Action directe ───────────────────────────────────────────────── */}
        {task.action && (
          <View className="mb-[24px]">
            <Text className="font-inter-semibold text-label text-accent uppercase tracking-widest mb-[10px] px-[2px]">
              {t('detail.directAction')}
            </Text>
            <Pressable onPress={handlePrimaryAction}>
              <View
                className="flex-row items-center justify-center gap-[10px] rounded-2xl h-[54px]"
                style={[{ backgroundColor: '#FF6B1A' }, Shadows.accent]}
              >
                {isVideoMeeting ? <Video size={18} color="#fff" /> : <Phone size={18} color="#fff" />}
                <Text className="font-inter-bold text-body-m text-white">{task.action.label}</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Garant ───────────────────────────────────────────────────────── */}
        {garant && (
          <View className="mb-[24px]">
            <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
              {t('detail.garant')}
            </Text>
            <View className="flex-row items-center gap-[12px] bg-card rounded-2xl px-[14px] py-[12px] border border-subtle">
              <View
                className="w-[40px] h-[40px] rounded-full items-center justify-center"
                style={{ backgroundColor: '#172436' }}
              >
                <Shield size={17} color="#00D68F" strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text className="font-inter-semibold text-body-m text-text-primary">
                  {garant.firstName} {garant.lastName}
                </Text>
                <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
                  {tG(`relationships.${garant.relationship}`)}
                </Text>
              </View>
              <Badge
                label={t('detail.alertAfter', { minutes: garant.alertDelayMinutes })}
                variant="danger"
              />
            </View>
          </View>
        )}

        {/* ── Description ──────────────────────────────────────────────────── */}
        {task.description && (
          <View className="mb-[24px]">
            <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
              {t('detail.description')}
            </Text>
            <Text className="font-inter-regular text-body-m text-text-secondary leading-[22px]">
              {task.description}
            </Text>
          </View>
        )}

        {/* ── Historique ───────────────────────────────────────────────────── */}
        <View className="mb-[32px]">
          <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[14px] px-[2px]">
            {t('detail.history')}
          </Text>
          <HistoryEntry
            label={t('detail.historyCreated')}
            time={dateUtils.fromNow(task.createdAt)}
            color="#00D68F"
          />
          {garantNotified && (
            <HistoryEntry
              label={t('detail.historyGarantNotified')}
              time={dateUtils.fromNow(task.updatedAt)}
              color="#FFB800"
            />
          )}
          <HistoryEntry
            label={t('detail.historyStatus', { status: t(`detail.status.${statusBadge.key}`) })}
            time={dateUtils.fromNow(task.updatedAt)}
            color={iconColor}
            isLast
          />
        </View>

        {task.status !== 'completed' && (
          <Button
            label={`✓  ${t('alarm.done')}`}
            variant="success"
            size="l"
            fullWidth
            onPress={() => completeTask(task.id)}
          />
        )}
      </ScrollView>

      <TaskEditSheet ref={editSheetRef} />
    </SafeScreenView>
  );
}
