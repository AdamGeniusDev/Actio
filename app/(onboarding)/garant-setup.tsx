import { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoiderScrollView } from '@good-react-native/keyboard-avoider';
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Lock,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Contacts from 'expo-contacts';
import { presentContactPickerAsync } from 'expo-contacts/legacy';

import { Animation } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { useAuthStore } from '@/stores/auth.store';

// ── Types ────────────────────────────────────────────────────────────────

type Relation = 'family' | 'friend' | 'colleague';
type Delay = '5min' | '10min' | '15min' | '30min' | '1h';

const RELATIONS: Relation[] = ['family', 'friend', 'colleague'];
const DELAYS: Delay[]       = ['5min', '10min', '15min', '30min', '1h'];

// Exemple dans l'aperçu tant qu'aucun rappel réel n'existe
const EXAMPLE_REMINDER = 'Prendre mes médicaments';

// ── Subcomponents ────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        className="w-11 h-11 rounded-md bg-raised items-center justify-center"
      >
        <ChevronLeft size={20} color="#F0F6FF" />
      </Pressable>
    </Animated.View>
  );
}

function ProgressDots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <View className="flex-row items-center gap-xs">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${
            i === activeIndex ? 'w-6 bg-accent' : 'w-1.5 bg-border'
          }`}
        />
      ))}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  getLabel,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  getLabel: (v: T) => string;
}) {
  return (
    <View className="flex-row bg-deep rounded-md p-1 gap-1">
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            className={`flex-1 items-center justify-center py-sm rounded-sm ${
              selected ? 'bg-raised' : ''
            }`}
          >
            <Text
              className={`font-inter-semibold text-body-s ${
                selected ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {getLabel(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DelayPills({
  value,
  onChange,
  getLabel,
}: {
  value: Delay;
  onChange: (v: Delay) => void;
  getLabel: (v: Delay) => string;
}) {
  return (
    <View className="flex-row flex-wrap gap-sm">
      {DELAYS.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={
              selected
                ? {
                    shadowColor: '#FF6B1A',
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 3,
                  }
                : undefined
            }
            className={`px-lg py-sm rounded-full border ${
              selected ? 'border-accent bg-accent-muted' : 'border-border bg-transparent'
            }`}
          >
            <Text
              className={`font-inter-semibold text-body-s ${
                selected ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              {getLabel(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────

export default function GarantSetupScreen() {
  const insets = useSafeAreaInsets();
  const { t }  = useTranslation('onboarding');

  const user               = useAuthStore((s) => s.user);
  const isPro              = useAuthStore((s) => s.user?.isPro ?? false);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const [contactName, setContactName] = useState<string | null>(null);
  const [firstName,   setFirstName]   = useState('');
  const [relation,    setRelation]    = useState<Relation>('family');
  const [delay,       setDelay]       = useState<Delay>('15min');
  const [autoMessage, setAutoMessage] = useState('');
  const [saving,      setSaving]      = useState(false);

  // ── Message généré automatiquement ──────────────────────────────────────
  //
  // La salutation change selon la relation :
  //   Famille / Ami  → ton familier  (salutationInformal)
  //   Collègue       → ton formel    (salutationFormal)
  //
  const salutation = t(
    relation === 'colleague'
      ? 'garant.fields.autoMessage.salutationFormal'
      : 'garant.fields.autoMessage.salutationInformal',
    { name: firstName || 'Thomas' },
  );

  const generatedMessage = t('garant.fields.autoMessage.preview', {
    salutation,
    userName: user?.firstName || user?.name || '…',
    reminder: EXAMPLE_REMINDER,
    delay:    t(`garant.fields.delay.options.${delay}`),
  });

  // Message affiché : version personnalisée Pro si saisie, sinon généré
  const displayMessage = autoMessage || generatedMessage;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChooseGarant = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('permissions.alerts.denied.title'),
          t(canAskAgain
            ? 'permissions.alerts.denied.message'
            : 'permissions.alerts.blocked.message'
          ),
        );
        return;
      }

      const contact = await presentContactPickerAsync();
      if (contact) {
        const name = contact.firstName || contact.name?.split(' ')[0] || '';
        setContactName(contact.name ?? name);
        setFirstName(name);
      }
    } catch {
      // Picker non disponible → saisie manuelle uniquement
    }
  }, [t]);

  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      // TODO: mutation TanStack `useCreateGarant` avec :
      // { firstName, relation, delayMinutes, autoMessage: displayMessage, isActive: true }
      setOnboardingComplete();
      router.replace('/(auth)/register' as any);
    } finally {
      setSaving(false);
    }
  }, [firstName, relation, delay, autoMessage, setOnboardingComplete]);

  const handleSkip = () => {
    setOnboardingComplete();
    router.replace('/(app)/(home)' as any);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeScreenView>

      {/* ── Header fixe — ne défile pas ── */}
      <View className="px-xl">
        <View className="relative flex-row items-center justify-center mt-md mb-2xl">
          <View className="absolute left-0">
            <BackButton onPress={() => router.back()} />
          </View>
          <ProgressDots total={3} activeIndex={2} />
        </View>
      </View>

      {/* ── Contenu scrollable avec gestion clavier automatique ── */}
      <KeyboardAvoiderScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140, paddingHorizontal: 20 }}
      >
        {/* Hero */}
        <Image
          source={require('@/assets/images/garant-hero.png')}
          className="w-full rounded-lg mb-2xl"
          style={{ aspectRatio: 343 / 230 }}
          resizeMode="cover"
        />

        {/* Titre */}
        <Text className="font-space-bold text-display-l text-text-primary mb-md">
          {t('garant.title')}
        </Text>
        <Text className="font-inter-regular text-body-m text-text-secondary mb-2xl">
          {t('garant.description')}
        </Text>

        {/* Card formulaire */}
        <View className="bg-card rounded-lg border border-border p-lg gap-2xl">

          {/* Choisir un Garant depuis les contacts */}
          <Pressable
            onPress={handleChooseGarant}
            className="flex-row items-center justify-between bg-raised rounded-md p-md"
          >
            <View className="flex-row items-center gap-md">
              <View className="w-11 h-11 rounded-full bg-deep items-center justify-center">
                <UserPlus size={20} color="#8BA3BE" />
              </View>
              <Text className="font-inter-semibold text-body-m text-text-primary">
                {contactName ?? t('garant.chooseCta')}
              </Text>
            </View>
            <ChevronRight size={18} color="#8BA3BE" />
          </Pressable>

          {/* Prénom */}
          <Input
            label={t('garant.fields.firstName.label')}
            placeholder={t('garant.fields.firstName.placeholder')}
            value={firstName}
            onChangeText={setFirstName}
          />

          {/* Relation */}
          <View className="gap-sm">
            <Text className="font-inter-semibold text-label text-text-secondary uppercase">
              {t('garant.fields.relation.label')}
            </Text>
            <SegmentedControl
              options={RELATIONS}
              value={relation}
              onChange={setRelation}
              getLabel={(v) => t(`garant.fields.relation.options.${v}`)}
            />
          </View>

          {/* Délai d'alerte */}
          <View className="gap-sm">
            <Text className="font-inter-semibold text-label text-text-secondary uppercase">
              {t('garant.fields.delay.label')}
            </Text>
            <DelayPills
              value={delay}
              onChange={setDelay}
              getLabel={(v) => t(`garant.fields.delay.options.${v}`)}
            />
          </View>

          {/* Message automatique */}
          <View className="gap-sm">
            <View className="flex-row items-center gap-sm">
              <Text className="font-inter-semibold text-label text-text-secondary uppercase">
                {t('garant.fields.autoMessage.label')}
              </Text>
              <Badge label="PRO" variant="accent" />
            </View>

            <View className="relative">
              {isPro ? (
                // Pro → TextInput éditable, pré-rempli avec le message généré
                <TextInput
                  value={displayMessage}
                  onChangeText={setAutoMessage}
                  multiline
                  textAlignVertical="top"
                  className="bg-deep rounded-md border border-accent/40 p-md
                             font-inter-regular text-body-s text-text-secondary leading-5"
                  style={{ minHeight: 88 }}
                />
              ) : (
                // Non-Pro → aperçu verrouillé
                <>
                  <View className="bg-deep rounded-md border border-border p-md opacity-50">
                    <Text className="font-inter-regular text-body-s text-text-secondary leading-5 italic">
                      {displayMessage}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(pro)' as any)}
                    className="absolute inset-0 items-center justify-center"
                  >
                    <View className="bg-background/80 rounded-full p-sm">
                      <Lock size={18} color="#8BA3BE" />
                    </View>
                  </Pressable>
                </>
              )}
            </View>
          </View>

        </View>
      </KeyboardAvoiderScrollView>

      {/* ── Footer fixe avec safe area ── */}
      <View
        className="absolute bottom-0 left-0 right-0 px-xl pt-md bg-deep border-t border-border gap-xs"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          label={t('garant.cta')}
          variant="primary"
          size="l"
          fullWidth
          loading={saving}
          onPress={handleFinish}
        />
        <Pressable onPress={handleSkip} className="items-center py-sm">
          <View className="flex-row items-center gap-xs">
            <Text className="font-inter-medium text-body-s text-text-secondary">
              {t('garant.skip')}
            </Text>
            <ArrowRight size={14} color="#8BA3BE" />
          </View>
        </Pressable>
      </View>

    </SafeScreenView>
  );
}