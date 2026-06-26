import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  /** 0-100 */
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label: string;
  sublabel: string;
}

export function CircularProgressRing({
  percentage,
  size = 220,
  strokeWidth = 18,
  color = '#00D68F',
  trackColor = '#1E3048',
  label,
  sublabel,
}: Props) {
  const radius        = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped        = Math.max(0, Math.min(100, percentage));
  const dashoffset     = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {/* Rotation -90° pour démarrer le tracé en haut (12h) plutôt qu'à droite (3h) */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View className="items-center">
        <Text className="font-space-bold text-[40px] leading-[44px] text-text-primary">
          {label}
        </Text>
        <Text className="font-inter-semibold text-label text-text-secondary mt-1">
          {sublabel}
        </Text>
      </View>
    </View>
  );
}