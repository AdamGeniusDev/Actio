import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X } from 'lucide-react-native';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useTasksStore } from '@/stores/tasks.store';

export default function SearchScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { t }   = useTranslation('home');
  const tasks   = useTasksStore((s) => s.tasks);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(q)
      || (task.description?.toLowerCase().includes(q) ?? false),
    );
  }, [tasks, query]);

  return (
    <SafeScreenView withGradient>
      <View className="flex-row items-center gap-[10px] px-[20px] py-[16px]">
        <View
          className="flex-1 flex-row items-center bg-card rounded-2xl px-[14px] border border-subtle"
          style={{ height: 48 }}
        >
          <SearchIcon size={17} color="#4A6480" strokeWidth={1.8} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#4A6480"
            autoFocus
            className="flex-1 font-inter-regular text-body-m text-text-primary ml-[10px]"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color="#4A6480" strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()}>
          <Text className="font-inter-semibold text-body-m text-accent">
            {t('search.cancel')}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <TaskCard task={item} />}
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <View className="items-center py-[40px]">
              <Text className="font-inter-regular text-body-m text-text-muted">
                {t('search.empty')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeScreenView>
  );
}
