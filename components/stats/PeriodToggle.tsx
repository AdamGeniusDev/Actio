import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Animation } from '@/constants/theme';
import type { StatsPeriod } from '@/types/stats.types';

interface Props {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

const OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: '7j', label: '7J' },
  { value: '30j', label: '30J' },
  { value: 'tout', label: 'Tout' },
];

function PeriodPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle} className="flex-1">
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        activeOpacity={1}
        className={`items-center justify-center rounded-full border py-sm ${
          active ? 'bg-accent border-accent' : 'bg-card border-border'
        }`}
      >
        <Text
          className={`font-inter-semibold text-body-s ${
            active ? 'text-white' : 'text-text-secondary'
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-sm">
      {OPTIONS.map((opt) => (
        <PeriodPill
          key={opt.value}
          label={opt.label}
          active={value === opt.value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}