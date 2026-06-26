import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import type { AiInsightSegment } from '@/types/stats.types';

interface Props {
  segments: AiInsightSegment[];
}

export function AiInsightCard({ segments }: Props) {
  return (
    <View className="flex-row bg-card rounded-md overflow-hidden">
      <View className="w-1 bg-accent" />
      <View className="flex-1 flex-row gap-md p-lg items-start">
        <View className="w-9 h-9 rounded-sm bg-accent-muted items-center justify-center">
          <Sparkles size={16} color="#FF6B1A" />
        </View>
        <Text className="flex-1 font-inter-regular text-body-s text-text-secondary leading-5">
          {segments.map((seg, i) => (
            <Text
              key={i}
              className={seg.emphasis ? 'font-inter-bold text-text-primary' : ''}
            >
              {seg.text}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
}