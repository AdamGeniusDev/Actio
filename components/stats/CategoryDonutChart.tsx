import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Shadows } from '@/constants/theme';
import type { CategoryBreakdown } from '@/types/stats.types';

interface Props {
  data: CategoryBreakdown[];
}

const BAR_HEIGHT = 28;

export function CategoryDonutChart({ data }: Props) {
  const { t } = useTranslation('stats');

  return (
    <View>
      <Text className="font-inter-semibold text-label text-text-secondary mb-md">
        {t('breakdown.sectionTitle')}
      </Text>
      <View className="bg-card rounded-xl border border-border p-2xl gap-xl" style={Shadows.card}>
        {/*
          Pill bar en Views natives plutôt qu'en SVG : avec un SVG en
          preserveAspectRatio="none", le rx du clip-path se fait étirer
          horizontalement (la mise à l'échelle x ≠ y), ce qui donnait des
          bouts ovales/écrasés au lieu d'un vrai pilule. Ici, rounded-full
          + overflow-hidden sur le conteneur donne un arrondi pixel-perfect
          quelle que soit la largeur réelle de l'écran.
        */}
        <View
          className="flex-row rounded-full overflow-hidden bg-deep"
          style={{ height: BAR_HEIGHT }}
        >
          {data.map((d) => (
            <View
              key={d.category}
              style={{ flex: Math.max(d.percentage, 0.01), backgroundColor: d.color }}
            />
          ))}
        </View>

        <View className="flex-row flex-wrap gap-md">
          {data.map((d) => (
            <View key={d.category} className="flex-row items-center gap-sm" style={{ width: '45%' }}>
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <Text className="font-inter-regular text-body-s text-text-secondary">
                {t(`breakdown.categories.${d.category}`, { defaultValue: d.label })} ({d.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}