import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, User, Timer, Flame, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { CircularProgressRing } from '@/components/stats/CircularProgressRing';
import { AiInsightCard } from '@/components/stats/AiInsightCard';
import { CompletedTaskRow } from '@/components/stats/CompletedTaskRow';
import { useStatsDayData } from '@/hooks/useStatsDayData';
import { BackButton } from '@/components/ui/BackButton';

function formatLongDate(date: string, lang: string): string {
  const formatted = dayjs(date).locale(lang === 'en' ? 'en' : 'fr').format('dddd D MMMM');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function StatsDayScreen() {
  const { date }              = useLocalSearchParams<{ date: string }>();
  const router                = useRouter();
  const { t, i18n }           = useTranslation('stats');
  const { data, isLoading, isError } = useStatsDayData(date);

  const title = useMemo(
    () => (date ? formatLongDate(date, i18n.language) : ''),
    [date, i18n.language],
  );

  return (
    <SafeScreenView withGradient>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-lg py-sm">
        <BackButton onPress={() => router.back()} />
        <Text className="font-space-bold text-display-s text-text-primary">
          {title}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-lg"
      >
        {isLoading && (
          <View className="py-7xl items-center">
            <Text className="font-inter-regular text-body-m text-text-muted">…</Text>
          </View>
        )}

        {isError && (
          <View className="py-7xl items-center">
            <Text className="font-inter-regular text-body-m text-text-secondary text-center">
              {t('states.error')}
            </Text>
          </View>
        )}

        {data && (
          <>
            {/* Anneau de progression */}
            <View className="items-center py-2xl">
              <CircularProgressRing
                percentage={data.completionRate}
                label={`${data.completionRate}%`}
                sublabel={t('day.tasksLabel', {
                  completed: data.tasksCompleted,
                  total: data.tasksTotal,
                }).toUpperCase()}
              />
            </View>

            {/* Mini-cards stats */}
            <View className="flex-row gap-sm mb-2xl">
              <View className="flex-1 bg-card rounded-md border border-subtle items-center py-md gap-1">
                <Timer size={16} color="#4D9EFF" />
                <Text className="font-space-bold text-[16px] text-text-primary">
                  {formatMinutes(data.timeSavedMinutes)}
                </Text>
                <Text className="font-inter-medium text-[10px] text-text-muted tracking-[0.6px]">
                  {t('day.stats.saved')}
                </Text>
              </View>
              <View className="flex-1 bg-card rounded-md border border-subtle items-center py-md gap-1">
                <Flame size={16} color="#FFB800" />
                <Text className="font-space-bold text-[16px] text-text-primary">
                  {data.streakDelta >= 0 ? '+' : ''}{data.streakDelta} {t('streak.days', { count: Math.abs(data.streakDelta) })}
                </Text>
                <Text className="font-inter-medium text-[10px] text-text-muted tracking-[0.6px]">
                  {t('day.stats.streak')}
                </Text>
              </View>
              <View className="flex-1 bg-card rounded-md border border-subtle items-center py-md gap-1">
                <Zap size={16} color="#FF3B5C" />
                <Text className="font-space-bold text-[16px] text-text-primary">
                  {data.urgentManaged}
                </Text>
                <Text className="font-inter-medium text-[10px] text-text-muted tracking-[0.6px]">
                  {t('day.stats.managed')}
                </Text>
              </View>
            </View>

            {/* Insights IA */}
            <Text className="font-inter-semibold text-label text-text-secondary mb-md">
              {t('day.insightsTitle')}
            </Text>
            <AiInsightCard segments={data.aiInsight} />

            {/* Tâches complétées */}
            <Text className="font-inter-semibold text-label text-text-secondary mt-2xl mb-md">
              {t('day.completedTitle')}
            </Text>
            {data.completedTasks.length === 0 ? (
              <Text className="font-inter-regular text-body-m text-text-muted text-center py-xl">
                {t('day.empty')}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {data.completedTasks.map((task) => (
                  <CompletedTaskRow key={task.id} task={task} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeScreenView>
  );
}