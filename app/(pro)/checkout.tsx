import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  ChevronLeft,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Shield,
  Lock,
  RefreshCw,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Localization from 'expo-localization';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { Animation, Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Button } from '@/components/ui/Button';
import { useCreateCheckoutMutation } from '@/hooks/api/useSubscription';
import { useUIStore } from '@/stores/ui.store';
import { ApiError } from '@/lib/api/client';

// ─── Région ───────────────────────────────────────────────────────────────────

const AFRICA_REGIONS = [
  'BJ','BF','CI','SN','ML','NE','TG','GN','CM','GA','CG','CD','CF',
  'TD','MR','KM','MG','DJ','BI','RW','GW','ST','GQ','CV','MZ','AO',
];

function useRegion(): 'africa' | 'world' {
  const region = Localization.getLocales()?.[0]?.regionCode ?? '';
  return AFRICA_REGIONS.includes(region) ? 'africa' : 'world';
}

// TVA par région
const TAX_RATE: Record<'africa' | 'world', number> = {
  africa: 0.18, // UEMOA 18%
  world:  0.20, // Europe 20%
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'apple_pay' | 'card' | 'paypal' | 'mobile_money';

type MobileOperator = 'mtn' | 'orange' | 'wave' | 'moov';

interface RouteParams {
  plan:   'monthly' | 'yearly';
  price:  number;
  unit:   string;
  period: string;
}

// ─── Couleurs opérateurs Mobile Money ────────────────────────────────────────

const OPERATOR_COLOR: Record<MobileOperator, string> = {
  mtn:    '#FFB800',
  orange: '#FF6B1A',
  wave:   '#4D9EFF',
  moov:   '#00D68F',
};

// ─── BackButton ───────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.9, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,   Animation.spring.press); }}
        className="w-[40px] h-[40px] rounded-[14px] items-center justify-center bg-raised border border-subtle"
        hitSlop={8}
      >
        <ChevronLeft size={20} color="#F0F6FF" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

// ─── OrderSummaryCard ─────────────────────────────────────────────────────────

interface OrderSummaryProps {
  planLabel:   string;
  planDesc:    string;
  price:       number;
  unit:        string;
  period:      string;
  taxRate:     number;
  taxLabel:    string;
  subtotalLabel: string;
  totalLabel:  string;
  secureBadge: string;
}

function OrderSummaryCard({
  planLabel, planDesc, price, unit, period,
  taxRate, taxLabel, subtotalLabel, totalLabel, secureBadge,
}: OrderSummaryProps) {
  const subtotal = price / (1 + taxRate);
  const tax      = price - subtotal;

  const fmt = (n: number) =>
    unit === 'FCFA'
      ? `${Math.round(n).toLocaleString('fr-FR')} FCFA`
      : `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit}`;

  const priceDisplay = unit === 'FCFA'
    ? `${price.toLocaleString('fr-FR')} FCFA`
    : `${price.toFixed(2).replace('.', ',')}${unit}`;

  return (
    <View
      className="rounded-2xl border border-subtle overflow-hidden mb-[24px]"
      style={{ ...Shadows.card, backgroundColor: '#121E2E' }}
    >
      {/* Plan header */}
      <View className="px-[20px] pt-[20px] pb-[16px] flex-row items-start justify-between">
        <View className="flex-1 mr-[12px]">
          <Text
            className="font-space-bold text-display-s text-text-primary mb-[4px]"
            style={{ includeFontPadding: false }}
          >
            {planLabel}
          </Text>
          <Text className="font-inter-regular text-body-s text-text-secondary">
            {planDesc}
          </Text>
        </View>
        <Text
          className="font-space-bold text-body-l text-accent"
          style={{ includeFontPadding: false }}
        >
          {priceDisplay}
        </Text>
      </View>

      {/* Divider */}
      <View className="h-px bg-subtle mx-[20px]" />

      {/* Breakdown */}
      <View className="px-[20px] pt-[16px] pb-[8px] gap-[10px]">
        <View className="flex-row justify-between">
          <Text className="font-inter-regular text-body-s text-text-secondary">{subtotalLabel}</Text>
          <Text className="font-inter-semibold text-body-s text-text-primary">{fmt(subtotal)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-inter-regular text-body-s text-text-secondary">
            {taxLabel} ({Math.round(taxRate * 100)}%)
          </Text>
          <Text className="font-inter-semibold text-body-s text-text-primary">{fmt(tax)}</Text>
        </View>
      </View>

      {/* Dashed divider */}
      <View
        className="mx-[20px] mb-[16px]"
        style={{ borderBottomWidth: 1, borderColor: '#2A4560', borderStyle: 'dashed' }}
      />

      {/* Total */}
      <View className="px-[20px] pb-[20px] flex-row justify-between items-center">
        <Text className="font-inter-bold text-body-l text-text-primary">{totalLabel}</Text>
        <Text
          className="font-space-bold text-body-l text-accent"
          style={{ includeFontPadding: false }}
        >
          {priceDisplay}
        </Text>
      </View>

      {/* Secure badge */}
      <View
        className="mx-[20px] mb-[20px] flex-row items-center justify-center gap-[8px] py-[10px] rounded-[12px]"
        style={{ backgroundColor: 'rgba(0, 214, 143, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 214, 143, 0.2)' }}
      >
        <Lock size={13} color="#00D68F" strokeWidth={2} />
        <Text
          className="font-inter-bold text-label text-success tracking-widest uppercase"
          style={{ includeFontPadding: false }}
        >
          {secureBadge}
        </Text>
      </View>
    </View>
  );
}

// ─── PaymentMethodTab ─────────────────────────────────────────────────────────

interface PaymentTabProps {
  id:       PaymentMethod;
  icon:     LucideIcon;
  label:    string;
  active:   boolean;
  onPress:  () => void;
}

function PaymentMethodTab({ id, icon: Icon, label, active, onPress }: PaymentTabProps) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[aStyle, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.95, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        className="items-center justify-center py-[14px] rounded-[14px] gap-[6px]"
        style={{
          backgroundColor: active ? 'rgba(255,107,26,0.10)' : '#121E2E',
          borderWidth:     active ? 1.5 : 1,
          borderColor:     active ? '#FF6B1A' : '#1E3048',
        }}
      >
        <Icon size={20} color={active ? '#FF6B1A' : '#4A6480'} strokeWidth={1.8} />
        <Text
          className="font-inter-semibold text-caption"
          style={{ color: active ? '#FF6B1A' : '#4A6480', includeFontPadding: false }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── StyledInput ──────────────────────────────────────────────────────────────

interface StyledInputProps {
  label:       string;
  placeholder: string;
  value:       string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  maxLength?:  number;
  leftIcon?:   LucideIcon;
}

function StyledInput({ label, placeholder, value, onChangeText, keyboardType = 'default', maxLength, leftIcon: LeftIcon }: StyledInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-[16px]">
      <Text className="font-inter-medium text-body-s text-text-secondary mb-[8px]">
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-[14px] px-[16px] gap-[10px]"
        style={{
          height:          52,
          backgroundColor: '#0D1520',
          borderWidth:     1.5,
          borderColor:     focused ? '#FF6B1A' : '#1E3048',
        }}
      >
        {LeftIcon && <LeftIcon size={18} color={focused ? '#FF6B1A' : '#4A6480'} strokeWidth={1.8} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#4A6480"
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            flex:              1,
            fontFamily:        'Inter-Regular',
            fontSize:          15,
            color:             '#F0F6FF',
            includeFontPadding: false,
          }}
        />
      </View>
    </View>
  );
}

// ─── OperatorSelector ─────────────────────────────────────────────────────────

function OperatorSelector({
  selected,
  onSelect,
  labels,
}: {
  selected: MobileOperator;
  onSelect: (o: MobileOperator) => void;
  labels:   Record<MobileOperator, string>;
}) {
  const operators: MobileOperator[] = ['mtn', 'orange', 'wave', 'moov'];

  return (
    <View className="flex-row gap-[8px] mb-[16px]">
      {operators.map((op) => {
        const active = selected === op;
        const color  = OPERATOR_COLOR[op];
        return (
          <Pressable
            key={op}
            onPress={() => onSelect(op)}
            className="flex-1 py-[10px] rounded-[12px] items-center"
            style={{
              backgroundColor: active ? `${color}18` : '#121E2E',
              borderWidth:     active ? 1.5 : 1,
              borderColor:     active ? color : '#1E3048',
            }}
          >
            <Text
              className="font-inter-bold text-caption"
              style={{ color: active ? color : '#4A6480', includeFontPadding: false }}
            >
              {labels[op]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── TrustBadges ──────────────────────────────────────────────────────────────

function TrustBadges({ labels }: { labels: [string, string, string] }) {
  const icons: LucideIcon[] = [Shield, Lock, RefreshCw];

  return (
    <View className="flex-row py-[24px]" style={{ gap: 12 }}>
      {icons.map((Icon, i) => (
        <View key={i} className="flex-1 items-center gap-[6px]">
          <Icon size={20} color="#00D68F" strokeWidth={1.8} />
          <Text
            className="font-inter-semibold text-caption text-text-muted tracking-wide uppercase text-center"
            style={{ includeFontPadding: false }}
            numberOfLines={2}
          >
            {labels[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── RedirectNotice — Apple Pay / PayPal ──────────────────────────────────────

function RedirectNotice({ message }: { message: string }) {
  return (
    <View
      className="items-center justify-center py-[28px] px-[20px] rounded-2xl border border-subtle mb-[8px]"
      style={{ backgroundColor: '#121E2E' }}
    >
      <Text className="font-inter-regular text-body-s text-text-secondary text-center leading-[22px]">
        {message}
      </Text>
    </View>
  );
}

// ─── Helpers de formatage ─────────────────────────────────────────────────────

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ─── CheckoutScreen ───────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const { t }   = useTranslation('pro');
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const region  = useRegion();
  const addToast = useUIStore((s) => s.addToast);
  const createCheckoutMutation = useCreateCheckoutMutation();
  const params  = useLocalSearchParams<{ plan?: string; price?: string; unit?: string; period?: string }>();

  // ── Plan reçu depuis l'écran pricing ────────────────────────────────────
  const plan: RouteParams['plan'] = params.plan === 'monthly' ? 'monthly' : 'yearly';
  const price  = Number(params.price ?? 0);
  const unit   = params.unit   ?? 'FCFA';
  const period = params.period ?? '/an';
  const taxRate = TAX_RATE[region];

  // ── Moyens de paiement disponibles ──────────────────────────────────────
  const methods = useMemo(() => {
    const list: { id: PaymentMethod; icon: LucideIcon; label: string }[] = [];
    if (Platform.OS === 'ios') {
      list.push({ id: 'apple_pay', icon: Smartphone, label: t('checkout.payment.methods.applePay') });
    }
    list.push({ id: 'card',         icon: CreditCard, label: t('checkout.payment.methods.card') });
    list.push({ id: 'mobile_money', icon: Wallet,      label: t('checkout.payment.methods.mobileMoney') });
    list.push({ id: 'paypal',       icon: Banknote,    label: t('checkout.payment.methods.paypal') });
    return list;
  }, [t]);

  const [method, setMethod] = useState<PaymentMethod>(Platform.OS === 'ios' ? 'apple_pay' : 'card');

  // ── État du formulaire carte ────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvc,        setCvc]        = useState('');

  // ── État du formulaire mobile money ─────────────────────────────────────
  const [operator, setOperator] = useState<MobileOperator>('mtn');
  const [phone,     setPhone]   = useState('');

  // ── État de soumission ───────────────────────────────────────────────────
  const [status, setStatus] = useState<'idle' | 'processing'>('idle');

  // Le choix de "moyen de paiement" ci-dessus est purement visuel — le
  // backend génère un seul lien (Moneroo ou LemonSqueezy selon le pays),
  // et c'est la page hébergée par ce prestataire qui propose réellement
  // carte/mobile money/PayPal. Rien de saisi ci-dessus n'est transmis.
  async function handleSubmit() {
    if (status === 'processing') return;
    setStatus('processing');

    try {
      const returnUrl = Linking.createURL('pro/success', { queryParams: { plan } });
      const countryCode = Localization.getLocales()?.[0]?.regionCode ?? undefined;

      const { checkoutUrl } = await createCheckoutMutation.mutateAsync({
        returnUrl,
        countryCode,
        billingPeriod: plan,
      });

      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

      if (result.type === 'success') {
        router.replace({ pathname: '/(app)/(pro)/success', params: { plan } } as any);
      } else {
        setStatus('idle'); // annulé/fermé par l'utilisateur, pas une erreur
      }
    } catch (error) {
      setStatus('idle');
      const message = error instanceof ApiError ? error.message : t('checkout.errors.generic');
      addToast({ message, type: 'error' });
    }
  }

  const planLabel = t(`checkout.summary.planLabel.${plan}`);

  return (
    <SafeScreenView withGradient>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View
          className="flex-row items-center gap-[12px] px-[24px]"
          style={{ paddingTop: insets.top, paddingBottom: 8 }}
        >
          <BackButton onPress={() => router.back()} />
          <Text
            className="font-space-bold text-display-s text-accent flex-1"
            style={{ includeFontPadding: false }}
          >
            {t('checkout.header.title')}
          </Text>
        </View>

        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {/* ── Récapitulatif de commande ─────────────────────────────── */}
          <OrderSummaryCard
            planLabel={planLabel}
            planDesc={t('checkout.summary.planDesc')}
            price={price}
            unit={unit}
            period={period}
            taxRate={taxRate}
            taxLabel={t('checkout.summary.tax')}
            subtotalLabel={t('checkout.summary.subtotal')}
            totalLabel={t('checkout.summary.total')}
            secureBadge={t('checkout.summary.secureBadge')}
          />

          {/* ── Moyen de paiement ──────────────────────────────────────── */}
          <Text
            className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[12px]"
            style={{ includeFontPadding: false }}
          >
            {t('checkout.payment.sectionTitle')}
          </Text>

          <View className="flex-row gap-[8px] mb-[20px]">
            {methods.map((m) => (
              <PaymentMethodTab
                key={m.id}
                id={m.id}
                icon={m.icon}
                label={m.label}
                active={method === m.id}
                onPress={() => setMethod(m.id)}
              />
            ))}
          </View>

          {/* ── Formulaire carte ───────────────────────────────────────── */}
          {method === 'card' && (
            <>
              <StyledInput
                label={t('checkout.payment.card.numberLabel')}
                placeholder={t('checkout.payment.card.numberPlaceholder')}
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                keyboardType="numeric"
                maxLength={19}
                leftIcon={CreditCard}
              />
              <View className="flex-row gap-[12px]">
                <View className="flex-1">
                  <StyledInput
                    label={t('checkout.payment.card.expiryLabel')}
                    placeholder={t('checkout.payment.card.expiryPlaceholder')}
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View className="flex-1">
                  <StyledInput
                    label={t('checkout.payment.card.cvcLabel')}
                    placeholder={t('checkout.payment.card.cvcPlaceholder')}
                    value={cvc}
                    onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
            </>
          )}

          {/* ── Formulaire mobile money ────────────────────────────────── */}
          {method === 'mobile_money' && (
            <>
              <Text className="font-inter-medium text-body-s text-text-secondary mb-[8px]">
                {t('checkout.payment.mobileMoney.operatorLabel')}
              </Text>
              <OperatorSelector
                selected={operator}
                onSelect={setOperator}
                labels={{
                  mtn:    t('checkout.payment.mobileMoney.operators.mtn'),
                  orange: t('checkout.payment.mobileMoney.operators.orange'),
                  wave:   t('checkout.payment.mobileMoney.operators.wave'),
                  moov:   t('checkout.payment.mobileMoney.operators.moov'),
                }}
              />
              <StyledInput
                label={t('checkout.payment.mobileMoney.phoneLabel')}
                placeholder={t('checkout.payment.mobileMoney.phonePlaceholder')}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 14))}
                keyboardType="phone-pad"
                leftIcon={Smartphone}
              />
            </>
          )}

          {/* ── Apple Pay / PayPal — pas de formulaire ─────────────────── */}
          {method === 'apple_pay' && (
            <RedirectNotice message={t('checkout.payment.redirect.applePay')} />
          )}
          {method === 'paypal' && (
            <RedirectNotice message={t('checkout.payment.redirect.paypal')} />
          )}

          {/* ── Badges de confiance ─────────────────────────────────────── */}
          <TrustBadges
            labels={[
              t('checkout.trust.ssl'),
              t('checkout.trust.encrypted'),
              t('checkout.trust.guarantee'),
            ]}
          />
        </KeyboardAwareScrollView>

        {/* ── CTA fixe ───────────────────────────────────────────────────── */}
        <View
          className="px-[24px]"
          style={{ paddingTop: 12, paddingBottom: insets.bottom + 16 }}
        >
          <Button
            label={status === 'processing' ? t('checkout.cta.processing') : t('checkout.cta.submit')}
            variant="primary"
            size="l"
            fullWidth
            onPress={handleSubmit}
            disabled={status === 'processing'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeScreenView>
  );
}