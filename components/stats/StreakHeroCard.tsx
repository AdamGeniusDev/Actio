import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Shadows, Gradients } from '@/constants/theme';
import type { StatsOverview } from '@/types/stats.types';

interface Props {
  overview: StatsOverview;
}

function getStreakMessage(t: TFunction, streak: number): string {
  if (streak === 0) return t('streak.message.zero');
  if (streak < 3) return t('streak.message.low');
  if (streak < 7) return t('streak.message.mid', { count: 7 - streak });
  if (streak < 30) return t('streak.message.good');
  return t('streak.message.excellent');
}

export function StreakHeroCard({ overview }: Props) {
  const { t } = useTranslation('stats');
  const { currentStreak, averageScore, averageFocusHours } = overview;

  return (
    <View className="overflow-hidden rounded-xl border border-border" style={Shadows.accent}>
      <LinearGradient
        colors={Gradients.hero.colors}
        style={StyleSheet.absoluteFill}
        start={Gradients.hero.start}
        end={Gradients.hero.end}
      />
      <View className="p-2xl gap-1">
        <Text className="font-inter-semibold text-label text-text-secondary">
          {t('streak.label')}
        </Text>
        <View className="flex-row items-baseline gap-sm mt-1.5">
          <Text style={{ fontSize: 32 }}>🔥</Text>
          <Text className="font-space-bold text-text-primary text-display-l">
            {currentStreak}
          </Text>
          <Text className="font-inter-medium text-body-m text-text-secondary">
            {t('streak.days', { count: currentStreak })}
          </Text>
        </View>
        <Text className="font-inter-regular text-body-s text-text-secondary mt-1">
          {getStreakMessage(t, currentStreak)}
        </Text>
        <View className="h-px bg-border opacity-50 my-lg" />
        <View className="flex-row items-center">
          <View className="flex-1 gap-0.5">
            <Text className="font-space-bold text-display-s text-text-primary">
              {averageScore}%
            </Text>
            <Text className="font-inter-regular text-caption text-text-secondary">
              {t('streak.averageScore')}
            </Text>
          </View>
          <View className="w-px bg-border opacity-50 mx-lg" style={{ height: 32 }} />
          <View className="flex-1 gap-0.5">
            <Text className="font-space-bold text-display-s text-text-primary">
              {averageFocusHours}h
            </Text>
            <Text className="font-inter-regular text-caption text-text-secondary">
              {t('streak.averageFocus')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}