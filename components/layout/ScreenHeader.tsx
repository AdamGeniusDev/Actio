import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton } from '../ui/BackButton';

interface Props {
  title:      string;
  subtitle?:  string;
  showBack?:  boolean;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = false, rightSlot }: Props) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-2xl py-lg">
      <View className="flex-row items-center gap-md flex-1">
        {showBack && (
          <BackButton onPress={() => router.back()} />
        )}
        <View className="flex-1">
          <Text className="font-space-bold text-text-primary text-display-m" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="font-inter-regular text-body-s text-text-secondary mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightSlot && <View className="ml-md">{rightSlot}</View>}
    </View>
  );
}