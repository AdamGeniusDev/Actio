import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import {
  BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput,
  BottomSheetFooter, type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Trash2, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TaskFormBody, type TaskFormValue } from '@/components/tasks/TaskFormBody';
import { useTaskById, useTasksStore } from '@/stores/tasks.store';

export interface TaskEditSheetHandle {
  present: (taskId: string) => void;
  dismiss: () => void;
}

export const TaskEditSheet = forwardRef<TaskEditSheetHandle>((_, ref) => {
  const { t } = useTranslation('task');
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const updateTask = useTasksStore((s) => s.updateTask);
  const removeTask = useTasksStore((s) => s.removeTask);

  const [taskId, setTaskId] = useState<string | null>(null);
  const task = useTaskById(taskId ?? undefined);

  const [title, setTitle] = useState('');
  const [form, setForm]   = useState<TaskFormValue | null>(null);
  // Stable — évite de repasser une nouvelle fonction à TaskFormBody à chaque
  // rendu (ex: à chaque frappe dans le champ titre, qui re-render ce parent).
  const handleFormChange = useCallback(
    (patch: Partial<TaskFormValue>) => setForm((f) => (f ? { ...f, ...patch } : f)),
    [],
  );

  useImperativeHandle(ref, () => ({
    present: (id) => {
      setTaskId(id);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  function handlePresented() {
    if (!task) return;
    setTitle(task.title);
    setForm({
      alertMode:     task.location ? 'location' : 'time',
      iconType:      task.iconType,
      date:          dayjs(task.scheduledAt),
      category:      task.category,
      priority:      task.priority,
      garantEnabled: !!task.garantId,
      garantId:      task.garantId,
      location:      task.location,
      action:        task.action,
    });
  }

  function handleSave() {
    if (!task || !form || !title.trim()) return;
    updateTask(task.id, {
      title: title.trim(),
      iconType: form.iconType,
      scheduledAt: form.date.toISOString(),
      category: form.category,
      priority: form.priority,
      garantId: form.garantEnabled ? form.garantId : undefined,
      location: form.alertMode === 'location' ? form.location : undefined,
      action: form.iconType === 'call' ? form.action : undefined,
    });
    sheetRef.current?.dismiss();
  }

  function handleDelete() {
    if (!task) return;
    Alert.alert(
      t('edit.deleteConfirmTitle'),
      t('edit.deleteConfirmMessage'),
      [
        { text: t('create.cancel'), style: 'cancel' },
        {
          text: t('edit.delete'),
          style: 'destructive',
          onPress: () => {
            removeTask(task.id);
            sheetRef.current?.dismiss();
          },
        },
      ],
    );
  }

  // Pied fixe via le mécanisme dédié de la lib (footerComponent +
  // BottomSheetFooter) — pris en compte par le calcul interne de hauteur du
  // sheet et gère correctement le clavier (remonte au-dessus au lieu d'être
  // masqué dessous).
  const renderFooter = useCallback((props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props}>
      <View
        className="px-[20px] pt-[14px]"
        style={{
          paddingBottom: insets.bottom + 14,
          borderTopWidth: 1,
          borderTopColor: '#1E3048',
          backgroundColor: '#121E2E',
        }}
      >
        <Button
          label={t('edit.save')}
          variant="primary"
          size="l"
          fullWidth
          onPress={handleSave}
        />

        <Pressable onPress={handleDelete} className="flex-row items-center justify-center gap-[8px] mt-[14px]">
          <Trash2 size={15} color="#FF3B5C" strokeWidth={1.8} />
          <Text className="font-inter-semibold text-body-s text-danger">
            {t('edit.delete')}
          </Text>
        </Pressable>
      </View>
    </BottomSheetFooter>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [title, form, task, insets.bottom]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['88%']}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      onChange={(index) => { if (index >= 0) handlePresented(); }}
      footerComponent={renderFooter}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
      backgroundStyle={{ backgroundColor: '#121E2E' }}
      handleIndicatorStyle={{ backgroundColor: '#2A4560' }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View className="flex-row items-center justify-between mb-[20px]">
          <Text className="font-space-bold text-display-s text-text-primary">
            {t('edit.title')}
          </Text>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={8}>
            <X size={20} color="#8BA3BE" strokeWidth={1.8} />
          </Pressable>
        </View>

        <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
          {t('edit.taskName')}
        </Text>
        <View
          className="rounded-[14px] px-[16px] mb-[20px]"
          style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048', justifyContent: 'center' }}
        >
          <BottomSheetTextInput
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#4A6480"
            style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
          />
        </View>

        {form && (
          <TaskFormBody value={form} onChange={handleFormChange} />
        )}

        {/* Espace tampon pour que le dernier champ ne soit jamais masqué par le pied fixe */}
        <View style={{ height: 90 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

TaskEditSheet.displayName = 'TaskEditSheet';
