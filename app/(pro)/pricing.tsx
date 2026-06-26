import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  BarChart2,
  Mic,
  Bell,
  ChevronLeft,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Animation, Gradients, Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';

// ─── Région & devise ──────────────────────────────────────────────────────────

import * as Localization from 'expo-localization';

const AFRICA_REGIONS = [
  'BJ','BF','CI','SN','ML','NE','TG','GN','CM','GA','CG','CD','CF',
  'TD','MR','KM','MG','DJ','BI','RW','GW','ST','GQ','CV','MZ','AO',
];

function useRegion(): 'africa' | 'world' {
  const region = Localization.getLocales()?.[0]?.regionCode ?? '';
  return AFRICA_REGIONS.includes(region) ? 'africa' : 'world';
}

const PRICES = {
  africa: {
    monthly: { amount: 2_000,  unit: 'FCFA', period: '/mois' },
    yearly:  { amount: 19_900, unit: 'FCFA', period: '/an',  monthly: '1 658 FCFA / mois' },
  },
  world: {
    monthly: { amount: 4.99, unit: '€', period: '/mois' },
    yearly:  { amount: 39.99, unit: '€', period: '/an',  monthly: '3,33 € / mois' },
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFeature {
  icon:      LucideIcon;
  label:     string;
  available: boolean;
}

// ─── BackButton — absolute, passe sur le contenu en scrollant ─────────────────

function BackButton({ onPress, top }: { onPress: () => void; top: number }) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[aStyle, { position: 'absolute', top, left: 16, zIndex: 50 }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.9, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,   Animation.spring.press); }}
        className="w-[40px] h-[40px] rounded-[14px] items-center justify-center bg-raised/80 border border-subtle"
        hitSlop={8}
      >
        <ChevronLeft size={20} color="#F0F6FF" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

// ─── BillingToggle ────────────────────────────────────────────────────────────

interface BillingToggleProps {
  isYearly: boolean;
  onChange: (v: boolean) => void;
  savings:  string;
}

function BillingToggle({ isYearly, onChange, savings }: BillingToggleProps) {
  const { t } = useTranslation('pro');

  return (
    <View className="flex-row items-center justify-center gap-[12px] py-[4px]">
      <Text className={`font-inter-semibold text-body-s ${!isYearly ? 'text-text-primary' : 'text-text-muted'}`}>
        {t('pricing.toggle.monthly')}
      </Text>

      <Toggle value={isYearly} onChange={onChange} />

      <Text className={`font-inter-semibold text-body-s ${isYearly ? 'text-text-primary' : 'text-text-muted'}`}>
        {t('pricing.toggle.yearly')}
      </Text>

      <View className="px-[8px] py-[3px] rounded-full bg-warning/20">
        <Text
          className="font-inter-bold text-caption text-warning"
          style={{ includeFontPadding: false }}
        >
          {savings}
        </Text>
      </View>
    </View>
  );
}

// ─── FeatureRow ───────────────────────────────────────────────────────────────

function FeatureRow({ icon: Icon, label, available }: PlanFeature) {
  const color = available ? '#FF6B1A' : '#4A6480';

  return (
    <View className="flex-row items-center gap-[10px] py-[6px]">
      {available
        ? <Icon size={16} color={color} strokeWidth={2} />
        : <XCircle size={16} color={color} strokeWidth={1.8} />
      }
      <Text
        className={`font-inter-medium text-body-s ${available ? 'text-text-primary' : 'text-text-muted'}`}
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── BaseCard ─────────────────────────────────────────────────────────────────

interface BaseCardProps {
  label:     string;
  price:     string;
  period:    string;
  features:  PlanFeature[];
  ctaLabel:  string;
  onPress:   () => void;
  disabled?: boolean;
}

function BaseCard({ label, price, period, features, ctaLabel, onPress, disabled }: BaseCardProps) {
  return (
    <View
      className="bg-card rounded-2xl p-[20px] border border-subtle mb-[16px]"
      style={Shadows.card}
    >
      <Text
        className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[12px]"
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>

      <View className="flex-row items-baseline gap-[4px] mb-[16px]">
        <Text
          className="font-space-bold text-display-l text-text-primary"
          style={{ includeFontPadding: false }}
        >
          {price}
        </Text>
        <Text className="font-inter-regular text-body-s text-text-muted">
          {period}
        </Text>
      </View>

      <View className="mb-[20px]">
        {features.map((f, i) => <FeatureRow key={i} {...f} />)}
      </View>

      <Button
        label={ctaLabel}
        variant="secondary"
        size="m"
        fullWidth
        onPress={onPress}
        disabled={disabled}
      />
    </View>
  );
}

// ─── ProCard ──────────────────────────────────────────────────────────────────

interface ProCardProps {
  label:        string;
  price:        string;
  period:       string;
  monthlyHint?: string;
  features:     PlanFeature[];
  badgeLabel:   string;
  ctaLabel:     string;
  onPress:      () => void;
}

function ProCard({ label, price, period, monthlyHint, features, badgeLabel, ctaLabel, onPress }: ProCardProps) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[aStyle, { marginBottom: 16 }]}>
      {/* Badge "MEILLEUR CHOIX" centré sur le bord supérieur */}
      <View className="items-center" style={{ marginBottom: -14, zIndex: 10 }}>
        <LinearGradient
          colors={Gradients.accent.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 }}
        >
          <Text
            className="font-inter-bold text-label text-white uppercase tracking-widest"
            style={{ includeFontPadding: false }}
          >
            {badgeLabel}
          </Text>
        </LinearGradient>
      </View>

      <Pressable
        onPressIn={()  => { scale.value = withSpring(0.985, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,     Animation.spring.press); }}
        onPress={onPress}
      >
        <View
          className="rounded-2xl p-[20px]"
          style={{
            backgroundColor: '#0F2035',
            borderWidth:     1.5,
            borderColor:     '#FF6B1A',
            ...Shadows.accent,
          }}
        >
          <Text
            className="font-inter-semibold text-label text-accent uppercase tracking-widest mb-[12px]"
            style={{ includeFontPadding: false }}
          >
            {label}
          </Text>

          <View className="flex-row items-baseline gap-[4px]">
            <Text
              className="font-space-bold text-display-l text-text-primary"
              style={{ includeFontPadding: false }}
            >
              {price}
            </Text>
            <Text className="font-inter-regular text-body-s text-text-muted">
              {period}
            </Text>
          </View>

          {monthlyHint ? (
            <Text className="font-inter-regular text-body-s text-text-muted mt-[2px] mb-[16px]">
              {monthlyHint}
            </Text>
          ) : (
            <View className="mb-[16px]" />
          )}

          <View className="mb-[20px]">
            {features.map((f, i) => <FeatureRow key={i} {...f} />)}
          </View>

          <Button
            label={ctaLabel}
            variant="primary"
            size="l"
            fullWidth
            onPress={onPress}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}



// ─── PricingScreen ────────────────────────────────────────────────────────────

export default function PricingScreen() {
  const { t }  = useTranslation('pro');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const region = useRegion();

  const [yearly, setYearly] = useState(true);

  const prices  = PRICES[region];
  const current = yearly ? prices.yearly : prices.monthly;

  const formatPrice = (amount: number, unit: string) =>
    unit === 'FCFA'
      ? `${amount.toLocaleString('fr-FR')} FCFA`
      : `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit}`;

  const proPrice  = formatPrice(current.amount, current.unit);

  // ── Features Base ──────────────────────────────────────────────────────────
  const baseFeatures: PlanFeature[] = [
    { icon: CheckCircle2, label: t('pricing.base.f1'), available: true  },
    { icon: CheckCircle2, label: t('pricing.base.f2'), available: true  },
    { icon: CheckCircle2, label: t('pricing.base.f3'), available: true  },
    { icon: CheckCircle2, label: t('pricing.base.f4'), available: true  },
    { icon: XCircle,      label: t('pricing.base.f5'), available: false },
  ];

  // ── Features Pro ───────────────────────────────────────────────────────────
  const proFeatures: PlanFeature[] = [
    { icon: Zap,      label: t('pricing.pro.f1'), available: true },
    { icon: Zap,      label: t('pricing.pro.f2'), available: true },
    { icon: Bell,     label: t('pricing.pro.f3'), available: true },
    { icon: Bell,     label: t('pricing.pro.f4'), available: true },
    { icon: Sparkles, label: t('pricing.pro.f5'), available: true },
    { icon: Mic,      label: t('pricing.pro.f6'), available: true },
    { icon: Bell,     label: t('pricing.pro.f7'), available: true },
    { icon: BarChart2,label: t('pricing.pro.f8'), available: true },
  ];

  return (
    <SafeScreenView withGradient>

      {/* ── BackButton — absolute, glisse sous le contenu en scrollant ── */}
      <BackButton
        onPress={() => router.back()}
        top={insets.top + 12}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom:     insets.bottom + 32,
          paddingTop:        72,
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View className="items-center pb-[28px]">
          <Text
            className="font-space-bold text-display-l text-text-primary text-center mb-[8px]"
            style={{ includeFontPadding: false }}
          >
            {t('pricing.hero.title')}
          </Text>
          <Text className="font-inter-regular text-body-m text-text-secondary text-center leading-[24px]">
            {t('pricing.hero.subtitle')}
          </Text>
        </View>

        {/* ── Toggle ───────────────────────────────────────────────────── */}
        <View className="mb-[28px]">
          <BillingToggle
            isYearly={yearly}
            onChange={setYearly}
            savings="-33% SAVINGS"
          />
        </View>

        {/* ── Carte Base ───────────────────────────────────────────────── */}
        <BaseCard
          label={t('pricing.base.label')}
          price={`0 ${current.unit}`}
          period={t('pricing.base.period')}
          features={baseFeatures}
          ctaLabel={t('pricing.base.cta')}
          onPress={() => {}}
          disabled
        />

        {/* ── Carte Pro ────────────────────────────────────────────────── */}
        <ProCard
          label={t('pricing.pro.label')}
          price={proPrice}
          period={current.period}
          monthlyHint={
            yearly && 'monthly' in current
              ? `${t('pricing.pro.monthlyHint')} ${(current as typeof prices.yearly).monthly}`
              : undefined
          }
          features={proFeatures}
          badgeLabel={t('pricing.pro.badge')}
          ctaLabel={t('pricing.pro.cta')}
          onPress={() => router.push({
            pathname: '/(app)/(pro)/checkout',
            params: {
              plan: yearly ? 'yearly' : 'monthly',
              price: current.amount,
              unit: current.unit,
              period: current.period,
            },
          } as any)}
        />

      </ScrollView>
    </SafeScreenView>
  );
}