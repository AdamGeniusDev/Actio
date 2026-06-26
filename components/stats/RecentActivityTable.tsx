import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Shadows } from '@/constants/theme';
import { dateKey } from '@/utils/date.utils';
import type { RecentActivityEntry } from '@/types/stats.types';

interface Props {
  data: RecentActivityEntry[];
}

function getCompletionColorClass(rate: number): string {
  if (rate >= 90) return 'text-success';
  if (rate >= 60) return 'text-accent';
  return 'text-danger';
}

export function RecentActivityTable({ data }: Props) {
  const { t } = useTranslation('stats');
  const router = useRouter();

  return (
    <View>
      <Text className="font-inter-semibold text-label text-text-secondary mb-md">
        {t('recent.sectionTitle')}
      </Text>
      <View className="bg-card rounded-xl border border-border px-2xl" style={Shadows.card}>
        <View className="flex-row py-md border-b border-border">
          <Text className="font-inter-semibold text-caption text-text-muted" style={{ flex: 1.4 }}>
            {t('recent.table.date')}
          </Text>
          <Text className="font-inter-semibold text-caption text-text-muted" style={{ flex: 1 }}>
            {t('recent.table.count')}
          </Text>
          <Text
            className="font-inter-semibold text-caption text-text-muted text-right"
            style={{ flex: 1 }}
          >
            {t('recent.table.completion')}
          </Text>
        </View>
        {data.map((entry, i) => (
          <Pressable
            key={entry.date}
            onPress={() => router.push(`/stats/${dateKey(new Date(entry.date))}` as any)}
            className={`flex-row items-center py-lg ${
              i !== data.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <Text
              className="font-inter-semibold text-body-m text-text-primary"
              style={{ flex: 1.4 }}
              numberOfLines={1}
            >
              {entry.dateLabel}
            </Text>
            <Text className="font-inter-regular text-body-m text-text-secondary" style={{ flex: 1 }}>
              {t('recent.tasksCount', { count: entry.tasksCount })}
            </Text>
            <Text
              className={`font-inter-semibold text-body-m text-right ${getCompletionColorClass(entry.completionRate)}`}
              style={{ flex: 1 }}
            >
              {entry.completionRate}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}