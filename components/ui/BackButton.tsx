import { Animation } from '@/constants/theme';
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function BackButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        className="w-11 h-11 rounded-md bg-raised items-center justify-center"
      >
        <ChevronLeft size={20} color="#F0F6FF" />
      </Pressable>
    </Animated.View>
  );
}
