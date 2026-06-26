import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import type { CompletedTaskEntry } from '@/types/stats.types';

interface Props {
  task: CompletedTaskEntry;
}

export function CompletedTaskRow({ task }: Props) {
  return (
    <View className="flex-row items-center bg-card rounded-md overflow-hidden">
      <View className="w-1 bg-success" />
      <View className="flex-1 flex-row items-center gap-md px-lg py-md">
        <View className="w-6 h-6 rounded-xs bg-accent items-center justify-center">
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </View>
        <Text
          className="flex-1 font-inter-medium text-body-m text-text-muted"
          style={{ textDecorationLine: 'line-through' }}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <Text className="font-inter-regular text-body-s text-text-secondary">
          {task.time}
        </Text>
      </View>
    </View>
  );
}