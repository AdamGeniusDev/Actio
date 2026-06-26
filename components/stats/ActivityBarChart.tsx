import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Shadows } from '@/constants/theme';
import { dateKey } from '@/utils/date.utils';
import type { ActivityDay } from '@/types/stats.types';

interface Props {
  data: ActivityDay[];
}

const CHART_HEIGHT = 140;
const BAR_RADIUS = 6;
const BAR_WIDTH = 28;
const MIN_BAR_HEIGHT = 6; // garantit une barre visible même à 0%

// Au-delà de ce nombre de barres, la rangée passe en scroll horizontal plutôt
// que de tout écraser dans la largeur de la card. Pas atteint avec le cap
// actuel du mock (30j ≈ 5 barres hebdo), mais protège le jour où l'historique
// réel ira plus loin.
const SCROLL_THRESHOLD = 7;

export function ActivityBarChart({ data }: Props) {
  const { t } = useTranslation('stats');
  const router = useRouter();
  const todayIso = dayjs().format('YYYY-MM-DD');

  const isWeeklyView = data[0]?.granularity === 'week';

  function renderBar(day: ActivityDay, i: number) {
    const isWeekly  = day.granularity === 'week';
    const isCurrent = isWeekly
      ? day.weekOffset === 0
      : dayjs(day.date).format('YYYY-MM-DD') === todayIso;

    const barHeight   = Math.max(MIN_BAR_HEIGHT, (day.completionRate / 100) * CHART_HEIGHT);
    const gradientId  = `barGradient-${i}`;
    const stopStart   = isCurrent ? '#FF6B1A' : '#7A3A1E';
    const stopEnd     = isCurrent ? '#FF8C42' : '#5C2C18';

    const label = isWeekly
      ? day.weekOffset === 0
        ? t('activity.thisWeek')
        : t('activity.weekShort', { n: Math.abs(day.weekOffset ?? 0) })
      : day.dayLabel;

    const bar = (
      <View className="items-center gap-sm">
        <Text className={`font-inter-semibold text-[10px] ${isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
          {day.completionRate}%
        </Text>
        <Svg width={BAR_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={stopStart} stopOpacity={1} />
              <Stop offset="1" stopColor={stopEnd} stopOpacity={1} />
            </SvgLinearGradient>
          </Defs>
          <Rect
            x={0}
            y={CHART_HEIGHT - barHeight}
            width={BAR_WIDTH}
            height={barHeight}
            rx={BAR_RADIUS}
            fill={`url(#${gradientId})`}
          />
        </Svg>
        <Text
          className={`font-inter-medium text-body-s ${
            isCurrent ? 'text-text-primary font-inter-semibold' : 'text-text-muted'
          }`}
        >
          {label}
        </Text>
      </View>
    );

    // Une barre jour ouvre le détail de ce jour précis. Une barre semaine est un
    // agrégat de 7 jours : il n'y a pas de date unique vers laquelle naviguer,
    // donc elle reste informative plutôt que tappable.
    if (isWeekly) {
      return <View key={`${day.date}-${i}`}>{bar}</View>;
    }
    return (
      <Pressable
        key={day.date}
        onPress={() => router.push(`/stats/${dateKey(new Date(day.date))}` as any)}
      >
        {bar}
      </Pressable>
    );
  }

  return (
    <View>
      <Text className="font-inter-semibold text-label text-text-secondary mb-1">
        {t('activity.sectionTitle')}
      </Text>
      <Text className="font-inter-regular text-caption text-text-muted mb-md">
        {t(isWeeklyView ? 'activity.subtitleWeekly' : 'activity.subtitle')}
      </Text>
      <View className="bg-card rounded-xl border border-border p-2xl" style={Shadows.card}>
        {data.length > SCROLL_THRESHOLD ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, flexGrow: 1, justifyContent: 'space-between' }}
          >
            {data.map(renderBar)}
          </ScrollView>
        ) : (
          <View className="flex-row justify-between items-end">
            {data.map(renderBar)}
          </View>
        )}
      </View>
    </View>
  );
}