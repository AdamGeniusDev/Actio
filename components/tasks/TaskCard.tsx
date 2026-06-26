import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Shadows, Status, Animation } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { dateUtils } from '@/utils/date.utils';
import type { Task } from '@/types/task.types';
import type { ComponentProps } from 'react';

const PRIORITY_BADGE: Record<Task['priority'], ComponentProps<typeof Badge>['variant']> = {
  low: 'ghost', medium: 'info', high: 'warning', critical: 'danger',
};

const STATUS_COLOR: Record<Task['status'], string> = {
  pending:     Status.normal,
  in_progress: Status.urgent,
  completed:   Status.done,
  snoozed:     Status.guarantor,
  failed:      Status.late,
};

interface Props { task: Task; }

export function TaskCard({ task }: Props) {
  const router = useRouter();
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isLate = task.status !== 'completed'
    && task.status !== 'failed'
    && new Date(task.scheduledAt) < new Date();

  return (
    <Animated.View style={aStyle}>
      <TouchableOpacity
        onPress={() => router.push(('/(app)/(home)/' + task.id) as any)}
        onPressIn={() => { scale.value = withSpring(0.97, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        activeOpacity={1}
      >
        <View style={[s.card, { borderLeftColor: STATUS_COLOR[task.status] }, isLate ? Shadows.urgent : Shadows.card]}>
          <View style={s.row}>
            <Text style={s.title} numberOfLines={2}>{task.title}</Text>
            <Badge label={task.priority} variant={PRIORITY_BADGE[task.priority]} />
          </View>
          <View style={s.meta}>
            <Text style={s.time}>🕐 {dateUtils.formatTime(task.scheduledAt)}</Text>
            {task.status === 'completed' && <Text style={s.done}>✓ Fait</Text>}
            {task.status === 'snoozed'   && <Text style={s.snoozed}>💤 Reporté</Text>}
            {isLate                      && <Text style={s.late}>⚠️ En retard</Text>}
          </View>
          {task.description && (
            <Text style={s.desc} numberOfLines={1}>{task.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card:    { backgroundColor: '#121E2E', borderRadius: 16, borderWidth: 1, borderColor: '#1E3048', borderLeftWidth: 3, padding: 16, gap: 8 },
  row:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title:   { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#F0F6FF', flex: 1 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  time:    { fontFamily: 'Inter-Medium', fontSize: 13, color: '#8BA3BE' },
  done:    { fontFamily: 'Inter-Medium', fontSize: 12, color: '#00D68F' },
  snoozed: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#4D9EFF' },
  late:    { fontFamily: 'Inter-Medium', fontSize: 12, color: '#FF3B5C' },
  desc:    { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4A6480' },
});
