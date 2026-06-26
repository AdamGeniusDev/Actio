import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Phone, Video, Check, ChevronDown } from 'lucide-react-native';

import { Gradients, Shadows, Animation } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { GlowBackground, type GlowBlobConfig } from '@/components/ui/GlowBackground';
import { SnoozeSheet, type SnoozeSheetHandle } from '@/components/tasks/SnoozeSheet';
import { useAlarmStore } from '@/stores/alarm.store';
import { useTaskById, useTasksStore } from '@/stores/tasks.store';
import { ICON_TYPE_ICON, ICON_TYPE_COLOR, buildActionUrl } from '@/utils/taskAction.utils';
import { dateUtils } from '@/utils/date.utils';

// ─── Lueurs — variante orange/chaude, distincte du reste de l'app ───────────

function getAlarmGlowBlobs(width: number, height: number): GlowBlobConfig[] {
  return [
    { id: 'alarmGlow1', color: '#FF6B1A', size: 520, peakOpacity: 0.5,  top: -160,            left: -160,           rangeX: 28, rangeY: 22, duration: 8600 },
    { id: 'alarmGlow2', color: '#FF8C42', size: 460, peakOpacity: 0.4,  top: height * 0.5,    left: width - 260,    rangeX: 26, rangeY: 30, duration: 9800 },
    { id: 'alarmGlow3', color: '#FF3D00', size: 500, peakOpacity: 0.45, top: height - 360,    left: width * 0.35,   rangeX: 30, rangeY: 24, duration: 7400 },
  ];
}

const SWIPE_DISMISS_THRESHOLD = 120;

export function AlarmOverlay() {
  const { t }    = useTranslation('task');
  const { t: tF } = useTranslation('filters');
  const { state, config, dismiss, snooze } = useAlarmStore();
  const task   = useTaskById(config?.taskId);
  const completeTask = useTasksStore((s) => s.completeTask);
  const snoozeTask    = useTasksStore((s) => s.snoozeTask);

  const snoozeSheetRef = useRef<SnoozeSheetHandle>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (state !== 'ringing') return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const translateY = useSharedValue(0);

  function handleIgnore() {
    dismiss();
  }

  // Mémoïsé — sinon ce geste (et sa logique interne) serait recréé à chaque
  // rendu de l'overlay, même quand l'alarme est idle (state !== 'ringing').
  const pan = useMemo(
    () => Gesture.Pan()
      .onUpdate((e) => {
        translateY.value = Math.max(0, e.translationY);
      })
      .onEnd(() => {
        if (translateY.value > SWIPE_DISMISS_THRESHOLD) {
          translateY.value = withTiming(800, { duration: 200 }, () => {
            runOnJS(handleIgnore)();
          });
        } else {
          translateY.value = withSpring(0, Animation.spring.snappy);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const panStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   1 - Math.min(translateY.value / 400, 0.6),
  }));

  if (state !== 'ringing' || !task || !config) return null;

  const Icon       = ICON_TYPE_ICON[task.iconType];
  const iconColor  = ICON_TYPE_COLOR[task.iconType];
  const isVideoMeeting = task.iconType === 'event' && !!task.action;

  function handleQuickSnooze(minutes: number) {
    const newTime = dayjs(task!.scheduledAt).add(minutes, 'minute').toISOString();
    snoozeTask(task!.id, newTime);
    snooze();
    dismiss();
  }

  function handleComplete() {
    completeTask(task!.id);
    dismiss();
  }

  async function handlePrimaryAction() {
    if (!task!.action) return;
    try { await Linking.openURL(buildActionUrl(task!.action)); } catch {}
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <GlowBackground blobs={getAlarmGlowBlobs} />

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[panStyle, { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}
        >
          {/* ── Heure / date ──────────────────────────────────────────────── */}
          <Text
            className="font-clash-bold text-text-primary"
            style={{ fontSize: 64, letterSpacing: -2, color: '#FFD9B8' }}
          >
            {dateUtils.formatTime(now.toISOString())}
          </Text>
          <Text className="font-inter-medium text-body-s text-text-secondary uppercase tracking-[3px] mt-[8px] mb-[32px]">
            {dayjs(now).format('dddd D MMMM YYYY')}
          </Text>

          {/* ── Carte de la tâche ─────────────────────────────────────────── */}
          <View
            className="w-full flex-row items-center gap-[14px] bg-card rounded-2xl px-[16px] py-[16px] mb-[28px] border-l-[3px]"
            style={[{ borderLeftColor: iconColor }, Shadows.card]}
          >
            <IconBadge icon={Icon} color={iconColor} size={46} iconSize={20} opacityHex="26" />
            <View className="flex-1">
              <Text className="font-inter-semibold text-body-l text-text-primary" numberOfLines={2}>
                {task.title}
              </Text>
              <View className="flex-row items-center gap-[8px] mt-[6px]">
                <View className="bg-deep rounded-full px-[10px] py-[3px]">
                  <Text className="font-inter-medium text-caption text-text-secondary">
                    {dateUtils.formatTime(task.scheduledAt)}
                  </Text>
                </View>
                <View className="bg-deep rounded-full px-[10px] py-[3px]">
                  <Text className="font-inter-medium text-caption text-text-secondary">
                    {tF(task.category)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Action directe ────────────────────────────────────────────── */}
          {task.action && (
            <Pressable onPress={handlePrimaryAction} style={{ width: '100%', marginBottom: 14 }}>
              <View
                className="flex-row items-center justify-center gap-[10px] rounded-2xl h-[58px]"
                style={[{ backgroundColor: '#FF6B1A' }, Shadows.accent]}
              >
                {isVideoMeeting ? (
                  <Video size={20} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Phone size={20} color="#FFFFFF" strokeWidth={2} />
                )}
                <Text className="font-inter-bold text-body-l text-white">
                  {task.action.label}
                </Text>
              </View>
            </Pressable>
          )}

          {/* ── Snooze rapide ──────────────────────────────────────────────── */}
          {config.snoozeCount < config.maxSnooze && (
            <View className="flex-row gap-[10px] w-full mb-[14px]">
              {[5, 30].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => handleQuickSnooze(m)}
                  onLongPress={() => snoozeSheetRef.current?.present(task.id)}
                  className="flex-1 items-center justify-center rounded-full py-[12px]"
                  style={{ backgroundColor: '#121E2E', borderWidth: 1, borderColor: '#2A4560' }}
                >
                  <Text className="font-inter-semibold text-body-s text-text-secondary">+{m}min</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => handleQuickSnooze(60 * 14)} // demain matin (~14h plus tard que maintenant en moyenne)
                onLongPress={() => snoozeSheetRef.current?.present(task.id)}
                className="flex-1 items-center justify-center rounded-full py-[12px]"
                style={{ backgroundColor: '#121E2E', borderWidth: 1, borderColor: '#2A4560' }}
              >
                <Text className="font-inter-semibold text-body-s text-text-secondary">{t('snooze.tomorrow')}</Text>
              </Pressable>
            </View>
          )}

          {/* ── C'est fait ! ──────────────────────────────────────────────── */}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Button
              label={`✓  ${t('alarm.done')}`}
              variant="success"
              size="l"
              fullWidth
              onPress={handleComplete}
            />
          </View>

          <Pressable onPress={handleIgnore}>
            <Text className="font-inter-medium text-body-s text-text-muted underline">
              {t('alarm.ignore')}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-[6px] mt-[18px]">
            <ChevronDown size={14} color="#4A6480" strokeWidth={2} />
            <Text className="font-inter-medium text-caption text-text-muted uppercase tracking-widest">
              {t('alarm.swipeHint')}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>

      <SnoozeSheet ref={snoozeSheetRef} />
    </View>
  );
}
