import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Send } from 'lucide-react-native';

import { useGarantsStore, type Garant } from '@/stores/garants.store';
import { useAuthStore } from '@/stores/auth.store';
import { GarantEditForm } from '@/components/garants/GarantEditForm';

export interface GarantActionsSheetHandle {
  present: (garant: Garant) => void;
  dismiss: () => void;
}

type SheetView = 'actions' | 'edit';

const SNAP_POINTS: Record<SheetView, string[]> = {
  actions: ['38%'],
  edit:    ['85%'],
};

export const GarantActionsSheet = forwardRef<GarantActionsSheetHandle>((_, ref) => {
  const { t }      = useTranslation('garants');
  const isPro      = useAuthStore((s) => s.user?.isPro ?? false);
  const removeGarant = useGarantsStore((s) => s.removeGarant);
  const updateGarant = useGarantsStore((s) => s.updateGarant);
  const resendInvite = useGarantsStore((s) => s.resendInvite);

  const sheetRef  = useRef<BottomSheetModal>(null);
  const garantRef = useRef<Garant | null>(null);
  const [view, setView] = useState<SheetView>('actions');

  useImperativeHandle(ref, () => ({
    present: (garant) => {
      garantRef.current = garant;
      setView('actions');
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  function handleEdit() {
    setView('edit');
    // le snapPoint ne se met à jour qu'au prochain présent : on force le re-snap
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  }

  function handleSaveEdit(patch: Partial<Garant>) {
    const garant = garantRef.current;
    if (!garant) return;
    updateGarant(garant.id, patch);
    sheetRef.current?.dismiss();
  }

  function handleResend() {
    const garant = garantRef.current;
    if (!garant) return;
    resendInvite(garant.id);
    sheetRef.current?.dismiss();
    // TODO [API]: afficher un toast de confirmation une fois l'appel réseau effectué
  }

  function handleDelete() {
    const garant = garantRef.current;
    if (!garant) return;
    Alert.alert(
      t('actions.deleteConfirmTitle'),
      t('actions.deleteConfirmMessage', { name: garant.firstName }),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.delete'),
          style: 'destructive',
          onPress: () => {
            removeGarant(garant.id);
            sheetRef.current?.dismiss();
          },
        },
      ],
    );
  }

  const garant = garantRef.current;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS[view]}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      onDismiss={() => setView('actions')}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
      backgroundStyle={{ backgroundColor: '#121E2E' }}
      handleIndicatorStyle={{ backgroundColor: '#2A4560' }}
    >
      {view === 'edit' && garant ? (
        <GarantEditForm
          garant={garant}
          isPro={isPro}
          onSave={handleSaveEdit}
          onCancel={() => sheetRef.current?.dismiss()}
        />
      ) : (
        <BottomSheetView className="px-[20px] pt-[8px] pb-[24px]">
          {garant && (
            <View className="mb-[20px]">
              <Text className="font-inter-semibold text-body-l text-text-primary">
                {garant.firstName} {garant.lastName}
              </Text>
              <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
                {garant.mode === 'app'
                  ? (garant.inviteStatus === 'pending' ? t('actions.statusPending') : t('actions.statusAppLinked'))
                  : t('actions.statusDirect')}
              </Text>
            </View>
          )}

          <Pressable onPress={handleEdit} className="flex-row items-center py-[14px]">
            <Pencil size={18} color="#8BA3BE" strokeWidth={1.8} />
            <Text className="font-inter-medium text-body-m text-text-primary ml-[12px]">
              {t('actions.edit')}
            </Text>
          </Pressable>

          {garant?.mode === 'app' && garant.inviteStatus === 'pending' && (
            <Pressable onPress={handleResend} className="flex-row items-center py-[14px]">
              <Send size={18} color="#4D9EFF" strokeWidth={1.8} />
              <Text className="font-inter-medium text-body-m text-text-primary ml-[12px]">
                {t('actions.resendInvite')}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={handleDelete} className="flex-row items-center py-[14px]">
            <Trash2 size={18} color="#FF3B5C" strokeWidth={1.8} />
            <Text className="font-inter-medium text-body-m text-danger ml-[12px]">
              {t('actions.delete')}
            </Text>
          </Pressable>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

GarantActionsSheet.displayName = 'GarantActionsSheet';
