import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput,
  BottomSheetFooter, type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Sparkles, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TaskFormBody, type TaskFormValue } from '@/components/tasks/TaskFormBody';
import { useUIStore } from '@/stores/ui.store';
import { useTasksStore } from '@/stores/tasks.store';

const DEFAULT_FORM: TaskFormValue = {
  alertMode:     'time',
  iconType:      'checklist',
  date:          dayjs().add(1, 'hour').startOf('hour'),
  category:      'work',
  priority:      'medium',
  garantEnabled: false,
  garantId:      undefined,
  location:      undefined,
  action:        undefined,
};

export function TaskCreationSheet() {
  const { t }    = useTranslation('task');
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  const taskSheetOpen  = useUIStore((s) => s.taskSheetOpen);
  const taskDraft       = useUIStore((s) => s.taskDraft);
  const closeTaskSheet  = useUIStore((s) => s.closeTaskSheet);
  const addTask         = useTasksStore((s) => s.addTask);

  const [title, setTitle] = useState('');
  const [form, setForm]   = useState<TaskFormValue>(DEFAULT_FORM);
  // Stable — évite de repasser une nouvelle fonction à TaskFormBody à chaque
  // rendu (ex: à chaque frappe dans le champ titre, qui re-render ce parent).
  const handleFormChange = useCallback(
    (patch: Partial<TaskFormValue>) => setForm((f) => ({ ...f, ...patch })),
    [],
  );

  // Cet effet ne réagit qu'à l'OUVERTURE. La fermeture passe toujours par un
  // appel direct à sheetRef.current?.dismiss() (icône X, Annuler, Créer,
  // accès IA) — jamais par cet effet. Sinon, quand l'utilisateur ferme le
  // sheet lui-même (swipe/backdrop), son statut interne repasse à INITIAL,
  // et le simple fait que `taskSheetOpen` retombe à false ici déclencherait
  // un dismiss() redondant sur un sheet déjà fermé — ce qui corrompt le
  // statut interne de la lib vers DISMISSING et bloque tout rendu futur
  // (cf. session de debug : handlePortalRender ignore le rendu si DISMISSING).
  useEffect(() => {
    if (!taskSheetOpen) return;
    if (taskDraft) {
      setTitle(taskDraft.title ?? '');
      setForm({
        alertMode:     taskDraft.location ? 'location' : 'time',
        iconType:      taskDraft.iconType ?? 'checklist',
        date:          taskDraft.scheduledAt ? dayjs(taskDraft.scheduledAt) : dayjs().add(1, 'hour').startOf('hour'),
        category:      taskDraft.category ?? 'work',
        priority:      taskDraft.priority ?? 'medium',
        garantEnabled: !!taskDraft.garantId,
        garantId:      taskDraft.garantId,
        location:      taskDraft.location,
        action:        taskDraft.action,
      });
    }
    sheetRef.current?.present();
  }, [taskSheetOpen, taskDraft]);

  function handleCreate() {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      category: form.category,
      iconType: form.iconType,
      priority: form.priority,
      scheduledAt: form.date.toISOString(),
      garantId: form.garantEnabled ? form.garantId : undefined,
      location: form.alertMode === 'location' ? form.location : undefined,
      action: form.iconType === 'call' ? form.action : undefined,
    });
    setTitle('');
    setForm(DEFAULT_FORM);
    sheetRef.current?.dismiss();
  }

  function handleOpenAI() {
    sheetRef.current?.dismiss();
    router.push('/(app)/create' as any);
  }

  // Pied fixe via le mécanisme dédié de la lib (footerComponent +
  // BottomSheetFooter) plutôt qu'une View "flex:1" maison — celui-ci est pris
  // en compte par le calcul interne de hauteur du sheet ET gère correctement
  // le clavier (remonte au-dessus au lieu d'être masqué dessous).
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
          label={`✨ ${t('create.submit')}`}
          variant="primary"
          size="l"
          fullWidth
          onPress={handleCreate}
        />
        <Pressable onPress={() => sheetRef.current?.dismiss()} className="items-center mt-[14px]">
          <Text className="font-inter-medium text-body-s text-text-muted">
            {t('create.cancel')}
          </Text>
        </Pressable>
      </View>
    </BottomSheetFooter>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [title, form, insets.bottom]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['88%']}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      onDismiss={closeTaskSheet}
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
            {t('create.title')}
          </Text>
          <Pressable onPress={() => sheetRef.current?.dismiss()} hitSlop={8}>
            <X size={20} color="#8BA3BE" strokeWidth={1.8} />
          </Pressable>
        </View>

        {/* ── Titre + accès IA ────────────────────────────────────────────── */}
        <View
          className="flex-row items-center rounded-[14px] px-[16px] mb-[20px]"
          style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
        >
          <BottomSheetTextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('create.titlePlaceholder')}
            placeholderTextColor="#4A6480"
            style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
          />
          <Pressable
            onPress={handleOpenAI}
            className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
            style={{ backgroundColor: 'rgba(255,107,26,0.15)' }}
          >
            <Sparkles size={16} color="#FF6B1A" strokeWidth={2} />
          </Pressable>
        </View>

        <TaskFormBody value={form} onChange={handleFormChange} />

        {/* Espace tampon pour que le dernier champ ne soit jamais masqué par le pied fixe */}
        <View style={{ height: 90 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
