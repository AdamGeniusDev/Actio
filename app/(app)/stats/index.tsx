import { useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PeriodToggle } from '@/components/stats/PeriodToggle';
import { StreakHeroCard } from '@/components/stats/StreakHeroCard';
import { WeeklyGoalCard } from '@/components/stats/WeeklyGoalCard';
import { ActivityBarChart } from '@/components/stats/ActivityBarChart';
import { CategoryDonutChart } from '@/components/stats/CategoryDonutChart';
import { RecentActivityTable } from '@/components/stats/RecentActivityTable';
import { useStatsData } from '@/hooks/useStatsData';
import type { StatsPeriod } from '@/types/stats.types';

export default function StatsScreen() {
  const { t } = useTranslation('stats');
  const [period, setPeriod] = useState<StatsPeriod>('30j');
  const { data, isLoading, isError } = useStatsData({ period });

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('header.title')} />
      <ScrollView
        contentContainerClassName="px-4 pb-2xl gap-2xl"
        showsVerticalScrollIndicator={false}
      >
        <PeriodToggle value={period} onChange={setPeriod} />
        {isLoading && (
          <View className="py-7xl items-center">
            <ActivityIndicator color="#FF6B1A" />
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
          <View className="gap-3xl">
            <StreakHeroCard overview={data.overview} />
            <WeeklyGoalCard goal={data.weeklyGoal} />
            <ActivityBarChart data={data.activity} />
            <CategoryDonutChart data={data.breakdown} />
            <RecentActivityTable data={data.recent} />
          </View>
        )}
      </ScrollView>
    </SafeScreenView>
  );
}