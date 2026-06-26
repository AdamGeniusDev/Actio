import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Plus, Search, Bell, Clock, Calendar, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Gradients, Shadows } from '@/constants/theme';
import { useTasksStore } from '@/stores/tasks.store';
import { useGarantsStore } from '@/stores/garants.store';
import { useUIStore } from '@/stores/ui.store';
import { getLocalNotifications } from '@/utils/notifications.utils';
import { useTodayLabel } from '@/hooks/useTodayLabel';
import type { Task, TaskCategory } from '@/types/task.types';

const USER_NAME = 'Alex'; // TODO: remplacer par useAuthStore().user?.name

const IMMINENT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ─── Filtres ─────────────────────────────────────────────────────────────────
// labelKey = clé SANS préfixe namespace (namespace 'filters' géré par useTranslation)
const FILTER_KEYS: { labelKey: string; value: TaskCategory | null }[] = [
  { labelKey: 'all',      value: null },
  { labelKey: 'work',     value: 'work' },
  { labelKey: 'personal', value: 'personal' },
  { labelKey: 'health',   value: 'health' },
];

export default function HomeScreen() {
  const router = useRouter();
  // namespace 'home' → toutes les clés sont sans préfixe 'home.'
  const { t }       = useTranslation('home');
  const { t: tF }   = useTranslation('filters');
  const tasks       = useTasksStore((s) => s.tasks);
  const garants     = useGarantsStore((s) => s.garants);
  const openTaskSheet = useUIStore((s) => s.openTaskSheet);
  const [activeFilter, setActiveFilter] = useState<TaskCategory | null>(null);
  const todayLabel  = useTodayLabel();

  const notificationCount = useMemo(
    () => getLocalNotifications(tasks, garants).length,
    [tasks, garants],
  );

  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [tasks]);

  const hasTasks = sortedTasks.length > 0;

  const nextTask = useMemo(() => {
    const now = Date.now();
    return sortedTasks.find(
      (task) => task.status !== 'completed' && new Date(task.scheduledAt).getTime() > now,
    );
  }, [sortedTasks]);

  const filteredTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      if (nextTask && task.id === nextTask.id) return false;
      if (activeFilter === null) return true;
      return task.category === activeFilter;
    });
  }, [sortedTasks, activeFilter, nextTask]);

  const completedCount  = sortedTasks.filter((task) => task.status === 'completed').length;
  const inProgressCount = sortedTasks.filter((task) => task.status === 'in_progress').length;
  const remainingCount  = sortedTasks.length - completedCount - inProgressCount;
  const progress = sortedTasks.length > 0 ? completedCount / sortedTasks.length : 0;

  return (
    <SafeScreenView className="flex-1 bg-background" withGradient>
      {/* ─── Header fixe ──────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-4 py-md">
        <View className="flex-row items-center gap-md">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
            <Text className="font-clash-bold text-body-m text-white">AD</Text>
          </View>
          <Text className="font-inter-semibold text-body-l text-text-primary">
            {t('greeting', { name: USER_NAME })}
          </Text>
        </View>
        <View className="flex-row items-center gap-lg">
          <Pressable onPress={() => router.push('/(app)/(home)/search' as any)} hitSlop={8}>
            <Search size={22} color="#8BA3BE" />
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/(home)/notifications' as any)} hitSlop={8}>
            <Bell size={22} color="#8BA3BE" />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger items-center justify-center">
                <Text className="font-inter-bold text-[10px] text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ─── Contenu ──────────────────────────────────────────────────────── */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          hasTasks ? (
            <>
              {/* Carte "Votre journée" */}
              <View className="bg-card border border-border rounded-xl p-lg mb-xl">
                <View className="flex-row items-center justify-between mb-sm">
                  <Text className="font-inter-semibold text-label text-text-secondary">
                    🗓️ {todayLabel}
                  </Text>
                  <View className="bg-warning-muted rounded-full px-sm py-xs flex-row items-center gap-xs">
                    <Text className="text-body-s">🔥</Text>
                    <Text className="font-inter-semibold text-body-s text-warning">
                      {t('streak', { count: 7 })}
                    </Text>
                  </View>
                </View>

                <Text className="font-space-bold text-display-m text-text-primary mb-md">
                  {t('your_day')}
                </Text>

                <View className="flex-row items-center gap-lg mb-lg">
                  <View className="flex-row items-center gap-xs">
                    <View className="w-2 h-2 rounded-full bg-success" />
                    <Text className="font-inter-regular text-body-s text-text-secondary">
                      {t('completed', { count: completedCount })}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-xs">
                    <View className="w-2 h-2 rounded-full bg-accent" />
                    <Text className="font-inter-regular text-body-s text-text-secondary">
                      {t('in_progress', { count: inProgressCount })}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-xs">
                    <View className="w-2 h-2 rounded-full bg-text-muted" />
                    <Text className="font-inter-regular text-body-s text-text-secondary">
                      {t('remaining', { count: remainingCount })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-sm">
                  <Text className="font-inter-medium text-body-s text-text-secondary">
                    {t('progress_label')}
                  </Text>
                  <Text className="font-inter-semibold text-body-s text-accent">
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <View className="h-1.5 bg-border rounded-full overflow-hidden">
                  <View className="h-full bg-accent rounded-full" style={{ width: `${progress * 100}%` }} />
                </View>
              </View>

              {/* Carte "Prochaine tâche" */}
              {nextTask && <NextTaskCard task={nextTask} />}

              {/* Mes tâches */}
              <View className="flex-row items-center justify-between mb-lg">
                <Text className="font-space-bold text-display-s text-text-primary">
                  {t('my_tasks')}
                </Text>
                <Pressable onPress={() => router.push('/(app)/(home)/tasks' as any)}>
                  <Text className="font-inter-semibold text-body-s text-accent">
                    {t('see_all')}
                  </Text>
                </Pressable>
              </View>

              {/* ─── Filtres scrollables ─────────────────────────────────── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                className="mb-lg"
              >
                {FILTER_KEYS.map((filter) => {
                  const isActive = activeFilter === filter.value;
                  return (
                    <Pressable
                      key={filter.labelKey}
                      onPress={() => setActiveFilter(filter.value)}
                      className={`rounded-full px-lg py-sm ${isActive ? 'bg-accent' : 'bg-card border border-border'}`}
                    >
                      <Text
                        className={`font-inter-semibold text-body-s ${
                          isActive ? 'text-white' : 'text-text-secondary'
                        }`}
                      >
                        {tF(filter.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : null
        }
        ListEmptyComponent={
          <EmptyDashboard onAddTask={() => openTaskSheet()} />
        }
        renderItem={({ item }) => <TaskCard task={item} />}
      />
    </SafeScreenView>
  );
}

// ─── Carte "Prochaine tâche" ──────────────────────────────────────────────────

function NextTaskCard({ task }: { task: Task }) {
  const router   = useRouter();
  const { t }    = useTranslation('home');
  const { t: tF } = useTranslation('filters');
  const { t: tT } = useTranslation('task');
  const dueDate  = useMemo(() => new Date(task.scheduledAt), [task.scheduledAt]);

  const [remainingMs, setRemainingMs] = useState(() => dueDate.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(dueDate.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [dueDate]);

  const isImminent = remainingMs <= IMMINENT_THRESHOLD_MS && remainingMs > 0;

  const formattedTime = useMemo(
    () => dueDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    [dueDate],
  );

  return (
    <View className="mb-xl">
      <View className="flex-row items-center gap-xs mb-sm">
        <Text className="text-body-s">{isImminent ? '⏰' : '⚡'}</Text>
        <Text className="font-inter-semibold text-label text-accent">
          {isImminent ? t('imminent_label') : t('next_label')}
        </Text>
      </View>

      <LinearGradient {...Gradients.accent} style={[{ borderRadius: 20, padding: 20 }, Shadows.accent]}>
        <View className="flex-row items-start gap-md">
          <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
            <Clock size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="font-space-bold text-display-s text-white mb-xs">
              {task.title}
            </Text>
            <Text className="font-inter-regular text-body-s text-white/80">
              {tT('reminder', { time: formattedTime, category: tF(task.category ?? 'work') })}
            </Text>
          </View>
        </View>

        {isImminent && (
          <View className="bg-black/20 rounded-md py-sm px-md mt-lg items-center">
            <Text className="font-space-bold text-display-s text-white tabular-nums">
              {formatCountdown(remainingMs)}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push(`/(app)/(home)/${task.id}` as any)}
          className="flex-row items-center justify-center gap-xs bg-white/15 rounded-md h-12 mt-lg"
        >
          <Text className="font-inter-semibold text-body-m text-white">
            {t('view_details')}
          </Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EmptyDashboard({ onAddTask }: { onAddTask: () => void }) {
  const router = useRouter();
  // namespace 'home' → clés sans préfixe
  const { t } = useTranslation('home');

  const floatY = useSharedValue(0);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  floatY.value = withRepeat(
    withSequence(
      withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 1800, easing: Easing.inOut(Easing.sin) }),
    ),
    -1,
    true,
  );

  return (
    <View className="items-center px-4" style={{ paddingTop: 40 }}>
      <Animated.View
        style={[floatStyle, { backgroundColor: 'rgba(255,107,26,0.08)', borderWidth: 1, borderColor: '#1E3048' }]}
        className="w-44 h-44 rounded-2xl items-center justify-center mb-2xl overflow-hidden"
      >
        <Image
          source={require('@/assets/images/empty-today.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </Animated.View>

      <Text className="font-space-bold text-display-m text-text-primary mb-sm text-center">
        {t('empty_title')}
      </Text>
      <Text className="font-inter-regular text-body-m text-text-secondary text-center mb-2xl">
        {t('empty_subtitle')}
      </Text>

      <Pressable onPress={onAddTask} style={{ width: '100%' }}>
        <LinearGradient
          {...Gradients.accent}
          style={[
            {
              height: 52,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            },
            Shadows.accent,
          ]}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text className="font-inter-semibold text-body-l text-white">
            {t('add_task')}
          </Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(app)/(week)' as any)}
        className="flex-row items-center gap-xs mt-lg"
      >
        <Calendar size={16} color="#FF6B1A" />
        <Text className="font-inter-semibold text-body-m text-accent">
          {t('see_week')}
        </Text>
      </Pressable>
    </View>
  );
}