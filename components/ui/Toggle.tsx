// components/ui/Toggle.tsx
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients, Animation } from '@/constants/theme';

interface Props {
  value:     boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH  = 48;
const TRACK_HEIGHT = 25;
const THUMB_SIZE   = 20;
const PADDING      = 3;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2; // = 22

const trackBase = {
  width: TRACK_WIDTH,
  height: TRACK_HEIGHT,
  borderRadius: TRACK_HEIGHT / 2,
  justifyContent: 'center' as const,
  paddingHorizontal: PADDING,
};

const thumbBase = {
  width: THUMB_SIZE,
  height: THUMB_SIZE,
  borderRadius: THUMB_SIZE / 2,
};

export function Toggle({ value, onChange, disabled = false }: Props) {
  const progress = useSharedValue(value ? 1 : 0);

  // resynchronise l'anim si `value` change depuis le parent (composant contrôlé)
  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, Animation.spring.snappy);
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  const handlePress = () => {
    if (disabled) return;
    onChange(!value);
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled} hitSlop={8} style={{ opacity: disabled ? 0.4 : 1 }}>
      {value ? (
        <LinearGradient {...Gradients.accent} style={trackBase}>
          <Animated.View className="bg-white" style={[thumbBase, thumbStyle]} />
        </LinearGradient>
      ) : (
        <Animated.View className="bg-subtle" style={trackBase}>
          <Animated.View className="bg-white" style={[thumbBase, thumbStyle]} />
        </Animated.View>
      )}
    </Pressable>
  );
}