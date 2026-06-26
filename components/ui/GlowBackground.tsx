import { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

// ─── Fond ambiant — dégradés radiaux qui dérivent ─────────────────────────────
// On ne s'appuie pas sur un flou natif (BlurView dépend de l'OS/API et peut ne
// rien faire) : la diffusion vient du dégradé lui-même, qui s'estompe en
// transparence — ça rend pareil sur tous les appareils.
// Extrait de (pro)/success.tsx pour être réutilisé ailleurs (ex: alarme).

export type GlowBlobConfig = {
  id:          string;
  color:       string;
  size:        number;
  peakOpacity: number;
  top:         number;
  left:        number;
  rangeX:      number;
  rangeY:      number;
  duration:    number;
};

interface GlowBlobProps extends GlowBlobConfig {}

function GlowBlob({ id, size, color, top, left, rangeX, rangeY, duration, peakOpacity }: GlowBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true, // ping-pong — va et vient, jamais de saut
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-rangeX, rangeX]) },
      { translateY: interpolate(progress.value, [0, 1], [-rangeY, rangeY]) },
      { scale:       interpolate(progress.value, [0, 1], [0.9, 1.15])      },
    ],
  }));

  return (
    <Animated.View
      style={[style, { position: 'absolute', top, left, width: size, height: size }]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity={peakOpacity}       />
            <Stop offset="30%"  stopColor={color} stopOpacity={peakOpacity * 0.7} />
            <Stop offset="60%"  stopColor={color} stopOpacity={peakOpacity * 0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0}                 />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

interface Props {
  blobs: (width: number, height: number) => GlowBlobConfig[];
  backgroundColor?: string;
}

export function GlowBackground({ blobs, backgroundColor = '#080D14' }: Props) {
  const { width, height } = useWindowDimensions();
  const resolved = useMemo(() => blobs(width, height), [width, height, blobs]);

  return (
    <View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor, overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      {resolved.map((b) => <GlowBlob key={b.id} {...b} />)}
    </View>
  );
}
