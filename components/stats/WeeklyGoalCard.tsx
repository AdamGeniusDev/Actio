import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Shadows, Gradients } from '@/constants/theme';
import type { WeeklyGoal } from '@/types/stats.types';

interface Props {
  goal: WeeklyGoal;
}

export function WeeklyGoalCard({ goal }: Props) {
  const { t } = useTranslation('stats');
  const { title, description, current, target } = goal;
  const progress = Math.max(0, Math.min(1, current / target));

  return (
    <View>
      <Text className="font-inter-semibold text-label text-text-secondary mb-md">
        {t('weeklyGoal.sectionTitle')}
      </Text>
      <View className="bg-card rounded-xl border border-border p-2xl gap-lg" style={Shadows.card}>
        <View className="flex-row items-start gap-md">
          <View className="flex-1">
            <Text className="font-space-bold text-display-s text-text-primary">
              {title}
            </Text>
            <Text className="font-inter-regular text-body-s text-text-secondary mt-1">
              {description}
            </Text>
          </View>
          <Text className="font-inter-semibold text-body-m text-text-primary">
            {current}/{target}
          </Text>
        </View>
        <View className="h-2 rounded-full bg-deep overflow-hidden">
          <LinearGradient
            colors={Gradients.accent.colors}
            start={Gradients.accent.start}
            end={Gradients.accent.end}
            style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 999 }}
          />
        </View>
      </View>
    </View>
  );
}  