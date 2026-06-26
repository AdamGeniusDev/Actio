import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { Smartphone, MessageSquare, Crown, Lock } from 'lucide-react-native';

import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { createGarantDirectSchema } from '@/utils/validator';
import {
  DELAY_OPTIONS,
  type Garant,
  type Relationship,
  type DelayMinutes,
} from '@/stores/garants.store';

const RELATIONSHIPS: Relationship[] = ['family', 'friend', 'colleague', 'other'];

// Délai unique disponible sur l'offre gratuite — cf. add.tsx, même règle.
const FREE_DELAY_MINUTES: DelayMinutes = 15;

interface Props {
  garant:   Garant;
  isPro:    boolean;
  onSave:   (patch: Partial<Garant>) => void;
  onCancel: () => void;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[12px] px-[2px]">
      {label}
    </Text>
  );
}

function ProBadge() {
  return (
    <View
      className="flex-row items-center gap-[3px] px-[6px] py-[2px] rounded-full"
      style={{ backgroundColor: 'rgba(255,107,26,0.15)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.3)' }}
    >
      <Crown size={9} color="#FF6B1A" strokeWidth={2} />
      <Text className="font-inter-bold text-accent" style={{ includeFontPadding: false, fontSize: 9 }}>
        Pro
      </Text>
    </View>
  );
}

export function GarantEditForm({ garant, isPro, onSave, onCancel }: Props) {
  const { t } = useTranslation('garants');

  const [firstName, setFirstName] = useState(garant.firstName);
  const [lastName, setLastName] = useState(garant.lastName);
  const [relationship, setRelationship] = useState<Relationship>(garant.relationship);
  const [delayMinutes, setDelayMinutes] = useState<DelayMinutes>(garant.alertDelayMinutes);
  const [emailEnabled, setEmailEnabled] = useState(garant.channels?.email ?? true);
  const [smsEnabled, setSmsEnabled] = useState(garant.channels?.sms ?? false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(garant.channels?.whatsapp ?? false);

  function handleSave() {
    if (garant.mode === 'direct') {
      const result = createGarantDirectSchema.safeParse({ firstName, lastName });
      if (!result.success) {
        Alert.alert(t('add.validation.firstNameRequired'));
        return;
      }

      onSave({
        relationship,
        alertDelayMinutes: delayMinutes,
        firstName: result.data.firstName,
        lastName:  result.data.lastName ?? '',
        channels:  { email: emailEnabled, sms: isPro && smsEnabled, whatsapp: isPro && whatsappEnabled },
      });
      return;
    }

    onSave({ relationship, alertDelayMinutes: delayMinutes });
  }

  const ModeIcon = garant.mode === 'app' ? Smartphone : MessageSquare;

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Mode verrouillé ─────────────────────────────────────────────── */}
      <View
        className="flex-row items-center gap-[14px] rounded-2xl px-[16px] py-[14px] border mb-[24px]"
        style={{ backgroundColor: '#0D1520', borderColor: '#1E3048' }}
      >
        <View
          className="w-[40px] h-[40px] rounded-[12px] items-center justify-center"
          style={{ backgroundColor: garant.mode === 'app' ? 'rgba(77,158,255,0.12)' : 'rgba(255,184,0,0.12)' }}
        >
          <ModeIcon size={18} color={garant.mode === 'app' ? '#4D9EFF' : '#FFB800'} strokeWidth={1.8} />
        </View>
        <View className="flex-1">
          <Text className="font-inter-semibold text-body-m text-text-primary">
            {garant.mode === 'app' ? t('add.mode.app.title') : t('add.mode.direct.title')}
          </Text>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
            {t('edit.modeLocked')}
          </Text>
        </View>
      </View>

      {/* ── Identité / canaux ───────────────────────────────────────────── */}
      {garant.mode === 'app' ? (
        <View className="mb-[20px]">
          <SectionLabel label={t('add.invite.emailLabel')} />
          <View
            className="rounded-[14px] px-[16px] justify-center"
            style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
          >
            <Text className="font-inter-regular text-body-m text-text-secondary" numberOfLines={1}>
              {garant.email}
            </Text>
          </View>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[8px]">
            {t('edit.emailLocked')}
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-[20px]">
            <SectionLabel label={t('add.fields.firstName')} />
            <View
              className="rounded-[14px] px-[16px]"
              style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048', justifyContent: 'center' }}
            >
              <BottomSheetTextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Julien"
                placeholderTextColor="#4A6480"
                autoCapitalize="words"
                style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
              />
            </View>
          </View>

          <View className="mb-[20px]">
            <SectionLabel label={t('add.fields.lastName')} />
            <View
              className="rounded-[14px] px-[16px]"
              style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048', justifyContent: 'center' }}
            >
              <BottomSheetTextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Moreau"
                placeholderTextColor="#4A6480"
                autoCapitalize="words"
                style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
              />
            </View>
          </View>

          <View className="mb-[28px]">
            <SectionLabel label={t('add.channels.label')} />
            <View className="bg-card rounded-2xl overflow-hidden border border-subtle">
              <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
                <Text className="flex-1 font-inter-semibold text-body-m text-text-primary">
                  {t('add.channels.email')}
                </Text>
                <Toggle value={emailEnabled} onChange={setEmailEnabled} />
              </View>

              <View className="h-px bg-subtle mx-[16px]" />

              <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
                <View className="flex-1 flex-row items-center gap-[8px]">
                  <Text className="font-inter-semibold text-body-m text-text-primary">
                    {t('add.channels.sms')}
                  </Text>
                  <ProBadge />
                  {!isPro && <Lock size={12} color="#4A6480" strokeWidth={1.8} />}
                </View>
                <View style={{ opacity: !isPro ? 0.35 : 1 }}>
                  <Toggle value={!isPro ? false : smsEnabled} onChange={!isPro ? () => {} : setSmsEnabled} disabled={!isPro} />
                </View>
              </View>

              <View className="h-px bg-subtle mx-[16px]" />

              <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
                <View className="flex-1 flex-row items-center gap-[8px]">
                  <Text className="font-inter-semibold text-body-m text-text-primary">
                    {t('add.channels.whatsapp')}
                  </Text>
                  <ProBadge />
                  {!isPro && <Lock size={12} color="#4A6480" strokeWidth={1.8} />}
                </View>
                <View style={{ opacity: !isPro ? 0.35 : 1 }}>
                  <Toggle value={!isPro ? false : whatsappEnabled} onChange={!isPro ? () => {} : setWhatsappEnabled} disabled={!isPro} />
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      {/* ── Relation ─────────────────────────────────────────────────────── */}
      <View className="mb-[28px]">
        <SectionLabel label={t('add.relationship.label')} />
        <View className="rounded-2xl p-[8px] border border-subtle" style={{ backgroundColor: '#0D1520' }}>
          <View className="flex-row flex-wrap gap-[8px]">
            {RELATIONSHIPS.map((r) => {
              const active = relationship === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRelationship(r)}
                  className="items-center py-[12px] rounded-[12px]"
                  style={{ backgroundColor: active ? '#FF6B1A' : 'transparent', width: '47%' }}
                >
                  <Text
                    className="font-inter-semibold text-body-m"
                    style={{ color: active ? '#FFFFFF' : '#4A6480', includeFontPadding: false }}
                  >
                    {t(`relationships.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Délai ────────────────────────────────────────────────────────── */}
      <View className="mb-[32px]">
        <View className="flex-row items-center gap-[8px] mb-[12px] px-[2px]">
          <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest">
            {t('add.delay.label')}
          </Text>
          {!isPro && <ProBadge />}
        </View>

        {!isPro && (
          <Text className="font-inter-regular text-body-s text-text-muted mb-[12px]">
            {t('add.delay.lockedNote', { minutes: FREE_DELAY_MINUTES })}
          </Text>
        )}

        <View className="flex-row flex-wrap gap-[10px]">
          {DELAY_OPTIONS.map((d) => {
            const active = delayMinutes === d;
            const locked = !isPro && d !== FREE_DELAY_MINUTES;

            return (
              <Pressable
                key={d}
                onPress={() => { if (!locked) setDelayMinutes(d); }}
                disabled={locked}
                className="px-[20px] py-[10px] rounded-full border"
                style={{
                  backgroundColor: active ? '#FF6B1A' : 'transparent',
                  borderColor:     active ? '#FF6B1A' : '#2A4560',
                  opacity:         locked ? 0.35 : 1,
                }}
              >
                <Text
                  className="font-inter-semibold text-body-s"
                  style={{ color: active ? '#FFFFFF' : '#8BA3BE', includeFontPadding: false }}
                >
                  {d === 60 ? '1h' : `${d} min`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <View className="flex-row gap-[12px]">
        <View className="flex-1">
          <Button label={t('actions.cancel')} variant="secondary" fullWidth onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button label={t('edit.cta.save')} variant="primary" fullWidth onPress={handleSave} />
        </View>
      </View>
    </BottomSheetScrollView>
  );
}
