import { useMemo } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Clock, UserPlus, ChevronRight } from 'lucide-react-native';

import { Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useTasksStore } from '@/stores/tasks.store';
import { useGarantsStore } from '@/stores/garants.store';
import { getLocalNotifications, type LocalNotification } from '@/utils/notifications.utils';
import { dateUtils } from '@/utils/date.utils';

const ICON_BY_TYPE: Record<LocalNotification['type'], { icon: typeof AlertCircle; color: string }> = {
  overdue:      { icon: AlertCircle, color: '#FF3B5C' },
  dueSoon:      { icon: Clock,       color: '#FFB800' },
  garantInvite: { icon: UserPlus,    color: '#4D9EFF' },
};

export default function NotificationsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { t }   = useTranslation('home');

  const tasks   = useTasksStore((s) => s.tasks);
  const garants = useGarantsStore((s) => s.garants);
  const notifications = useMemo(() => getLocalNotifications(tasks, garants), [tasks, garants]);

  function handlePress(n: LocalNotification) {
    if (n.taskId) router.push(`/(app)/(home)/${n.taskId}` as any);
    else if (n.garantId) router.push('/(app)/(settings)/garants' as any);
  }

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('notifications.title')} showBack />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 10 }}
        renderItem={({ item }) => {
          const { icon: Icon, color } = ICON_BY_TYPE[item.type];
          return (
            <Pressable
              onPress={() => handlePress(item)}
              className="flex-row items-center bg-card rounded-2xl px-[14px] py-[14px] border border-subtle"
              style={Shadows.card}
            >
              <View
                className="w-[38px] h-[38px] rounded-[12px] items-center justify-center mr-[12px]"
                style={{ backgroundColor: `${color}1A` }}
              >
                <Icon size={17} color={color} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text className="font-inter-medium text-body-m text-text-primary" numberOfLines={1}>
                  {t(`notifications.${item.type}`, { title: item.title })}
                </Text>
                <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
                  {dateUtils.fromNow(item.timestamp)}
                </Text>
              </View>
              <ChevronRight size={16} color="#4A6480" strokeWidth={1.8} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-[40px]">
            <Text className="font-inter-regular text-body-m text-text-muted">
              {t('notifications.empty')}
            </Text>
          </View>
        }
      />
    </SafeScreenView>
  );
}
