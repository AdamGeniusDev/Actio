import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import {
  UserRoundPlus, ChevronRight, MessageSquare,
  Mail, Lock, Crown, Smartphone, Info,
} from 'lucide-react-native';

import { Animation, Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useAuthStore } from '@/stores/auth.store';
import { createGarantAppSchema, createGarantDirectSchema } from '@/utils/validator';
import {
  useGarantsStore,
  DELAY_OPTIONS,
  type Relationship,
  type GarantMode,
  type DelayMinutes,
} from '@/stores/garants.store';

const RELATIONSHIPS: Relationship[] = ['family', 'friend', 'colleague', 'other'];

// Délai unique disponible sur l'offre gratuite — les autres valeurs sont
// réservées Pro. 15 min reste le défaut historique de l'écran.
const FREE_DELAY_MINUTES: DelayMinutes = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      <Text
        className="font-inter-bold text-accent"
        style={{ includeFontPadding: false, fontSize: 9 }}
      >
        Pro
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-subtle mx-[16px]" />;
}

// ─── StyledInput ──────────────────────────────────────────────────────────────

function StyledInput({
  label, value, onChangeText, placeholder,
  autoCapitalize = 'words', keyboardType = 'default',
}: {
  label:            string;
  value:            string;
  onChangeText:     (v: string) => void;
  placeholder?:     string;
  autoCapitalize?:  'none' | 'words' | 'sentences';
  keyboardType?:    'default' | 'email-address' | 'phone-pad';
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-[20px]">
      <SectionLabel label={label} />
      <View
        className="rounded-[14px] px-[16px]"
        style={{
          height:          52,
          backgroundColor: '#0D1520',
          borderWidth:     1.5,
          borderColor:     focused ? '#FF6B1A' : '#1E3048',
          justifyContent:  'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#4A6480"
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            fontFamily:         'Inter-Regular',
            fontSize:           15,
            color:              '#F0F6FF',
            includeFontPadding: false,
          }}
        />
      </View>
    </View>
  );
}

// ─── ModeSelector ─────────────────────────────────────────────────────────────

function ModeSelector({
  selected,
  onSelect,
}: {
  selected: GarantMode;
  onSelect: (m: GarantMode) => void;
}) {
  const { t } = useTranslation('garants');

  const modes: { id: GarantMode; icon: React.ElementType; iconColor: string; titleKey: string; descKey: string }[] = [
    {
      id:         'app',
      icon:       Smartphone,
      iconColor:  '#4D9EFF',
      titleKey:   'add.mode.app.title',
      descKey:    'add.mode.app.desc',
    },
    {
      id:         'direct',
      icon:       MessageSquare,
      iconColor:  '#FFB800',
      titleKey:   'add.mode.direct.title',
      descKey:    'add.mode.direct.desc',
    },
  ];

  return (
    <View className="mb-[28px]">
      <SectionLabel label={t('add.mode.label')} />
      <View className="gap-[10px]">
        {modes.map((m) => {
          const active = selected === m.id;
          const Icon   = m.icon;

          return (
            <Pressable
              key={m.id}
              onPress={() => onSelect(m.id)}
              className="flex-row items-center rounded-2xl px-[16px] py-[14px] border"
              style={{
                backgroundColor: active ? 'rgba(255,107,26,0.08)' : '#0D1520',
                borderColor:     active ? '#FF6B1A' : '#1E3048',
                borderWidth:     active ? 1.5 : 1,
              }}
            >
              <View
                className="w-[40px] h-[40px] rounded-[12px] items-center justify-center mr-[14px]"
                style={{ backgroundColor: `${m.iconColor}18` }}
              >
                <Icon size={18} color={active ? '#FF6B1A' : m.iconColor} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <Text
                  className="font-inter-semibold text-body-m mb-[2px]"
                  style={{ color: active ? '#FF6B1A' : '#F0F6FF', includeFontPadding: false }}
                >
                  {t(m.titleKey)}
                </Text>
                <Text className="font-inter-regular text-body-s text-text-muted">
                  {t(m.descKey)}
                </Text>
              </View>
              <View
                className="w-[20px] h-[20px] rounded-full border-2 items-center justify-center ml-[10px]"
                style={{ borderColor: active ? '#FF6B1A' : '#2A4560' }}
              >
                {active && (
                  <View
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ backgroundColor: '#FF6B1A' }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── InviteByEmailForm — mode "app" ──────────────────────────────────────────

function InviteByEmailForm({
  email,
  onEmailChange,
}: {
  email:         string;
  onEmailChange: (v: string) => void;
}) {
  const { t } = useTranslation('garants');

  return (
    <View>
      <StyledInput
        label={t('add.invite.emailLabel')}
        value={email}
        onChangeText={onEmailChange}
        placeholder="garant@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View
        className="flex-row items-start gap-[10px] rounded-[14px] p-[14px] mb-[20px]"
        style={{ backgroundColor: 'rgba(77,158,255,0.08)', borderWidth: 1, borderColor: 'rgba(77,158,255,0.2)' }}
      >
        <Info size={16} color="#4D9EFF" strokeWidth={1.8} style={{ marginTop: 1 }} />
        <Text className="flex-1 font-inter-regular text-body-s text-info leading-[20px]">
          {t('add.invite.note')}
        </Text>
      </View>
    </View>
  );
}

// ─── ImportFromContacts — mode "direct" ──────────────────────────────────────

function ImportFromContacts({
  onImport,
}: {
  onImport: (firstName: string, lastName: string, phone: string) => void;
}) {
  const { t } = useTranslation('garants');
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  async function handlePress() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('add.contacts.permissionDenied'));
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.FirstName, Contacts.Fields.LastName, Contacts.Fields.PhoneNumbers],
    });
    if (!data.length) return;
    // TODO [contacts]: ouvrir un picker de sélection au lieu du premier contact
    const contact = data[0];
    onImport(
      contact.firstName ?? '',
      contact.lastName  ?? '',
      contact.phoneNumbers?.[0]?.number ?? '',
    );
  }

  return (
    <Animated.View style={[aStyle, { marginBottom: 20 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={()  => { scale.value = withSpring(0.97, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        className="flex-row items-center bg-card rounded-2xl px-[16px] py-[14px] border border-subtle"
        style={Shadows.card}
      >
        <View
          className="w-[40px] h-[40px] rounded-[12px] items-center justify-center mr-[14px]"
          style={{ backgroundColor: 'rgba(77,158,255,0.12)' }}
        >
          <UserRoundPlus size={18} color="#4D9EFF" strokeWidth={1.8} />
        </View>
        <View className="flex-1">
          <Text className="font-inter-semibold text-body-m text-text-primary">
            {t('add.contacts.title')}
          </Text>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
            {t('add.contacts.subtitle')}
          </Text>
        </View>
        <ChevronRight size={16} color="#4A6480" strokeWidth={1.8} />
      </Pressable>
    </Animated.View>
  );
}

// ─── DirectForm — mode "direct" ──────────────────────────────────────────────

function DirectForm({
  firstName, onFirstNameChange,
  lastName,  onLastNameChange,
  isPro,
  smsEnabled,      onSmsToggle,
  whatsappEnabled, onWhatsappToggle,
  emailEnabled,    onEmailToggle,
  onImport,
}: {
  firstName:        string;
  onFirstNameChange:(v: string) => void;
  lastName:         string;
  onLastNameChange: (v: string) => void;
  isPro:            boolean;
  smsEnabled:       boolean;
  onSmsToggle:      (v: boolean) => void;
  whatsappEnabled:  boolean;
  onWhatsappToggle: (v: boolean) => void;
  emailEnabled:     boolean;
  onEmailToggle:    (v: boolean) => void;
  onImport:         (fn: string, ln: string, phone: string) => void;
}) {
  const { t } = useTranslation('garants');

  return (
    <View>
      <ImportFromContacts onImport={onImport} />

      <StyledInput
        label={t('add.fields.firstName')}
        value={firstName}
        onChangeText={onFirstNameChange}
        placeholder="Julien"
      />
      <StyledInput
        label={t('add.fields.lastName')}
        value={lastName}
        onChangeText={onLastNameChange}
        placeholder="Moreau"
      />

      <View className="mb-[28px]">
        <SectionLabel label={t('add.channels.label')} />
        <View className="bg-card rounded-2xl overflow-hidden border border-subtle" style={Shadows.card}>

          <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
            <View
              className="w-[36px] h-[36px] rounded-[11px] items-center justify-center mr-[12px]"
              style={{ backgroundColor: 'rgba(0,214,143,0.12)' }}
            >
              <Mail size={17} color="#00D68F" strokeWidth={1.8} />
            </View>
            <Text className="flex-1 font-inter-semibold text-body-m text-text-primary">
              {t('add.channels.email')}
            </Text>
            <Toggle value={emailEnabled} onChange={onEmailToggle} />
          </View>

          <Divider />

          <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
            <View
              className="w-[36px] h-[36px] rounded-[11px] items-center justify-center mr-[12px]"
              style={{ backgroundColor: 'rgba(255,184,0,0.12)' }}
            >
              <MessageSquare size={17} color="#FFB800" strokeWidth={1.8} />
            </View>
            <View className="flex-1 flex-row items-center gap-[8px]">
              <Text className="font-inter-semibold text-body-m text-text-primary">
                {t('add.channels.sms')}
              </Text>
              <ProBadge />
              {!isPro && <Lock size={12} color="#4A6480" strokeWidth={1.8} />}
            </View>
            <View style={{ opacity: !isPro ? 0.35 : 1 }}>
              <Toggle value={!isPro ? false : smsEnabled} onChange={!isPro ? () => {} : onSmsToggle} disabled={!isPro} />
            </View>
          </View>

          <Divider />

          <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
            <View
              className="w-[36px] h-[36px] rounded-[11px] items-center justify-center mr-[12px]"
              style={{ backgroundColor: 'rgba(46,204,113,0.12)' }}
            >
              <MessageSquare size={17} color="#2ECC71" strokeWidth={1.8} />
            </View>
            <View className="flex-1 flex-row items-center gap-[8px]">
              <Text className="font-inter-semibold text-body-m text-text-primary">
                {t('add.channels.whatsapp')}
              </Text>
              <ProBadge />
              {!isPro && <Lock size={12} color="#4A6480" strokeWidth={1.8} />}
            </View>
            <View style={{ opacity: !isPro ? 0.35 : 1 }}>
              <Toggle value={!isPro ? false : whatsappEnabled} onChange={!isPro ? () => {} : onWhatsappToggle} disabled={!isPro} />
            </View>
          </View>

        </View>
      </View>
    </View>
  );
}

// ─── RelationshipSelector ─────────────────────────────────────────────────────

function RelationshipSelector({
  selected, onSelect,
}: {
  selected: Relationship;
  onSelect: (r: Relationship) => void;
}) {
  const { t } = useTranslation('garants');

  return (
    <View className="mb-[28px]">
      <SectionLabel label={t('add.relationship.label')} />
      <View
        className="rounded-2xl p-[8px] border border-subtle"
        style={{ backgroundColor: '#0D1520' }}
      >
        <View className="flex-row flex-wrap gap-[8px]">
          {RELATIONSHIPS.map((r) => {
            const active = selected === r;
            return (
              <Pressable
                key={r}
                onPress={() => onSelect(r)}
                className="items-center py-[12px] rounded-[12px]"
                style={{
                  backgroundColor: active ? '#FF6B1A' : 'transparent',
                  width:           '47%',
                }}
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
  );
}

// ─── DelaySelector ────────────────────────────────────────────────────────────

function DelaySelector({
  selected, onSelect, isPro,
}: {
  selected: DelayMinutes;
  onSelect: (d: DelayMinutes) => void;
  isPro:    boolean;
}) {
  const { t } = useTranslation('garants');

  return (
    <View className="mb-[28px]">
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
          const active = selected === d;
          const locked = !isPro && d !== FREE_DELAY_MINUTES;

          return (
            <Pressable
              key={d}
              onPress={() => { if (!locked) onSelect(d); }}
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
  );
}

// ─── MessagePreview ───────────────────────────────────────────────────────────

function MessagePreview({
  firstName, delayMinutes, isPro,
}: {
  firstName:    string;
  delayMinutes: DelayMinutes;
  isPro:        boolean;
}) {
  const { t }    = useTranslation('garants');
  const name     = firstName.trim() || t('add.preview.defaultName');
  const delay    = delayMinutes === 60 ? '1h' : `${delayMinutes} min`;

  return (
    <View className="mb-[24px]">
      <SectionLabel label={t('add.preview.label')} />
      <View
        className="rounded-2xl p-[16px]"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: '#FF6B1A',
          backgroundColor: '#0D1520',
          borderWidth:     1,
          borderColor:     '#1E3048',
        }}
      >
        <View className="flex-row items-center justify-between mb-[12px]">
          <View
            className="px-[8px] py-[3px] rounded-full"
            style={{ backgroundColor: isPro ? 'rgba(255,107,26,0.15)' : '#172436' }}
          >
            <Text
              className="font-inter-bold text-caption uppercase"
              style={{ color: isPro ? '#FF6B1A' : '#4A6480', includeFontPadding: false }}
            >
              {isPro ? 'Pro' : 'Base'}
            </Text>
          </View>
          <Text className="font-inter-regular text-caption text-text-muted uppercase tracking-widest">
            {t('add.preview.predefined')}
          </Text>
        </View>
        <Text className="font-inter-regular text-body-s text-text-secondary leading-[22px] italic">
          {t('add.preview.message', { name, delay })}
        </Text>
      </View>
    </View>
  );
}

// ─── PrivacyNote ──────────────────────────────────────────────────────────────

function PrivacyNote() {
  const { t } = useTranslation('garants');

  return (
    <View
      className="flex-row items-start gap-[12px] rounded-2xl p-[16px] mb-[32px] border"
      style={{ backgroundColor: 'rgba(255,59,92,0.06)', borderColor: 'rgba(255,59,92,0.18)' }}
    >
      <Lock size={16} color="#FF3B5C" strokeWidth={1.8} style={{ marginTop: 2 }} />
      <Text className="flex-1 font-inter-regular text-body-s text-text-secondary leading-[20px]">
        {t('add.privacy')}
      </Text>
    </View>
  );
}

// ─── AddGarantScreen ──────────────────────────────────────────────────────────
// Création uniquement — l'édition d'un garant existant se fait désormais
// directement dans GarantActionsSheet (cf. components/garants/GarantEditForm.tsx)
// plutôt que sur cet écran, le formulaire d'édition étant trop léger pour
// justifier une page entière.

export default function AddGarantScreen() {
  const { t }      = useTranslation('garants');
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const isPro      = useAuthStore(s => s.user?.isPro ?? false);
  const addGarant  = useGarantsStore((s) => s.addGarant);

  const [mode, setMode] = useState<GarantMode>('app');

  // Champs communs
  const [relationship, setRelationship] = useState<Relationship>('friend');
  const [delayMinutes, setDelayMinutes] = useState<DelayMinutes>(FREE_DELAY_MINUTES);

  // Mode "app" — invitation par email
  const [inviteEmail, setInviteEmail] = useState('');

  // Mode "direct" — nom + canaux
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [emailEnabled,    setEmailEnabled]    = useState(true);
  const [smsEnabled,      setSmsEnabled]      = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  // Garde-fou : si l'utilisateur perd son statut Pro pendant que l'écran est
  // ouvert, on retombe sur le délai gratuit plutôt que de garder une valeur
  // Pro orpheline.
  useEffect(() => {
    if (!isPro && delayMinutes !== FREE_DELAY_MINUTES) {
      setDelayMinutes(FREE_DELAY_MINUTES);
    }
  }, [isPro, delayMinutes]);

  function handleContactImport(fn: string, ln: string, _phone: string) {
    setFirstName(fn);
    setLastName(ln);
    // TODO [contacts]: stocker phone si ajouté au type Garant
  }

  function handleSave() {
    if (mode === 'app') {
      const result = createGarantAppSchema.safeParse({ email: inviteEmail });
      if (!result.success) {
        Alert.alert(t('add.validation.emailRequired'));
        return;
      }
      addGarant({
        mode:         'app',
        firstName:    result.data.email.split('@')[0] ?? '',
        lastName:     '',
        email:        result.data.email,
        inviteStatus: 'pending',
        relationship,
        alertDelayMinutes: delayMinutes,
      });
      // TODO [API]: appeler sendGarantInvitation — le garant reçoit un email
      // avec un lien pour accepter et télécharger l'app
    } else {
      const result = createGarantDirectSchema.safeParse({ firstName, lastName });
      if (!result.success) {
        Alert.alert(t('add.validation.firstNameRequired'));
        return;
      }
      addGarant({
        mode:      'direct',
        firstName: result.data.firstName,
        lastName:  result.data.lastName ?? '',
        channels:  { email: emailEnabled, sms: isPro && smsEnabled, whatsapp: isPro && whatsappEnabled },
        relationship,
        alertDelayMinutes: delayMinutes,
      });
    }

    router.back();
  }

  const previewFirstName = mode === 'app'
    ? (inviteEmail.split('@')[0] ?? '')
    : firstName;

  const SaveButton = (
    <Pressable onPress={handleSave}>
      <Text
        className="font-inter-bold text-body-m text-accent"
        style={{ includeFontPadding: false }}
      >
        {t('add.header.save')}
      </Text>
    </Pressable>
  );

  return (
    <SafeScreenView withGradient>
      <ScreenHeader
        title={t('add.header.title')}
        showBack
        rightSlot={SaveButton}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop:        20,
            paddingBottom:     insets.bottom + 32,
          }}
        >
          <ModeSelector selected={mode} onSelect={setMode} />

          {mode === 'app' ? (
            <InviteByEmailForm email={inviteEmail} onEmailChange={setInviteEmail} />
          ) : (
            <DirectForm
              firstName={firstName}        onFirstNameChange={setFirstName}
              lastName={lastName}          onLastNameChange={setLastName}
              isPro={isPro}
              smsEnabled={smsEnabled}           onSmsToggle={setSmsEnabled}
              whatsappEnabled={whatsappEnabled} onWhatsappToggle={setWhatsappEnabled}
              emailEnabled={emailEnabled}       onEmailToggle={setEmailEnabled}
              onImport={handleContactImport}
            />
          )}

          <RelationshipSelector selected={relationship} onSelect={setRelationship} />
          <DelaySelector selected={delayMinutes} onSelect={setDelayMinutes} isPro={isPro} />

          <MessagePreview
            firstName={previewFirstName}
            delayMinutes={delayMinutes}
            isPro={isPro}
          />

          <PrivacyNote />

          <Button
            label={mode === 'app' ? t('add.cta.invite') : t('add.cta.save')}
            variant="primary"
            size="l"
            fullWidth
            onPress={handleSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreenView>
  );
}
