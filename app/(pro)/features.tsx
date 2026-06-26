import { View, Text, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  Brain,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Mic,
  Bell,
  ChevronLeft,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Animation, Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon:         LucideIcon;
  iconBg:       string;
  iconColor:    string;
  badge?:       string;
  badgeColor?:  string;
  title:        string;
  description:  string;
  visual?:      React.ReactNode;
}

// ─── BadgePill ────────────────────────────────────────────────────────────────

function BadgePill({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="px-[10px] py-[3px] rounded-full"
      style={{ backgroundColor: `${color}22` }}
    >
      <Text
        className="font-inter-semibold text-caption"
        style={{ color, includeFontPadding: false }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── AnalyticsVisual ──────────────────────────────────────────────────────────

function AnalyticsVisual() {
  const bars = [
    { h: 28, active: false },
    { h: 44, active: false },
    { h: 36, active: false },
    { h: 64, active: true  },
    { h: 48, active: false },
  ];

  return (
    <View className="flex-row items-end gap-[8px] mt-[16px] px-[4px]">
      {bars.map((bar, i) => (
        <View
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height:          bar.h,
            backgroundColor: bar.active ? '#4D9EFF' : '#1E3048',
          }}
        />
      ))}
    </View>
  );
}

// ─── FeatureCard ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  iconBg,
  iconColor,
  badge,
  badgeColor,
  title,
  description,
  visual,
}: FeatureCardProps) {
  return (
    <View
      className="bg-card rounded-2xl p-[20px] border border-subtle mb-[16px]"
      style={Shadows.card}
    >
      <View className="flex-row items-start justify-between mb-[14px]">
        <View
          className="w-[46px] h-[46px] rounded-[14px] items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={22} color={iconColor} strokeWidth={1.8} />
        </View>
        {badge && badgeColor && (
          <BadgePill label={badge} color={badgeColor} />
        )}
      </View>

      <Text
        className="font-space-bold text-display-s text-text-primary mb-[8px]"
        style={{ includeFontPadding: false }}
      >
        {title}
      </Text>

      <Text className="font-inter-regular text-body-s text-text-secondary leading-[20px]">
        {description}
      </Text>

      {visual}
    </View>
  );
}

// ─── RestoreButton ────────────────────────────────────────────────────────────

function RestoreButton({ onPress }: { onPress: () => void }) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.96, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        className="flex-row items-center gap-[6px] px-[14px] py-[8px] rounded-full bg-raised border border-subtle"
      >
        <RefreshCw size={13} color="#8BA3BE" strokeWidth={1.8} />
        <Text
          className="font-inter-medium text-body-s text-text-secondary"
          style={{ includeFontPadding: false }}
        >
          Restore
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── BackButton — position absolute, passe par-dessus le contenu ──────────────

function BackButton({ onPress, top }: { onPress: () => void; top: number }) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        aStyle,
        {
          position: 'absolute',
          top,
          left:     16,
          zIndex:   50,
        },
      ]}
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

// ─── FeaturesScreen ───────────────────────────────────────────────────────────

export default function FeaturesScreen() {
  const { t }   = useTranslation('pro');
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore(s => s.user);

  const showRestore = (user?.isPro ?? false) || (user?.hasEverSubscribed ?? false);

  const features: FeatureCardProps[] = [
    {
      icon:        Shield,
      iconBg:      'rgba(255, 107, 26, 0.15)',
      iconColor:   '#FF6B1A',
      badge:       t('features.garants.badge'),
      badgeColor:  '#FF6B1A',
      title:       t('features.garants.title'),
      description: t('features.garants.description'),
    },
    {
      icon:        Brain,
      iconBg:      'rgba(255, 184, 0, 0.15)',
      iconColor:   '#FFB800',
      badge:       t('features.ai.badge'),
      badgeColor:  '#FFB800',
      title:       t('features.ai.title'),
      description: t('features.ai.description'),
    },
    {
      icon:        Mic,
      iconBg:      'rgba(0, 214, 143, 0.15)',
      iconColor:   '#00D68F',
      badge:       t('features.voice.badge'),
      badgeColor:  '#00D68F',
      title:       t('features.voice.title'),
      description: t('features.voice.description'),
    },
    {
      icon:        BarChart3,
      iconBg:      'rgba(77, 158, 255, 0.15)',
      iconColor:   '#4D9EFF',
      title:       t('features.analytics.title'),
      description: t('features.analytics.description'),
      visual:      <AnalyticsVisual />,
    },
    {
      icon:        Bell,
      iconBg:      'rgba(255, 184, 0, 0.15)',
      iconColor:   '#FFB800',
      title:       t('features.alarm.title'),
      description: t('features.alarm.description'),
    },
  ];

  return (
    // SafeScreenView gère paddingTop (insets.top) et le gradient
    // Le BackButton et le RestoreButton sont en absolute par-dessus le scroll
    <SafeScreenView withGradient>

      {/* ── BackButton — absolute, glisse sous le contenu en scrollant ── */}
      <BackButton
        onPress={() => router.back()}
        top={insets.top + 12}
      />

      {/* ── Restore — absolute en haut à droite, conditionnel ─────────── */}
      {showRestore && (
        <Animated.View
          style={{
            position: 'absolute',
            top:      insets.top + 12,
            right:    16,
            zIndex:   50,
          }}
        >
          <RestoreButton onPress={() => { /* TODO [API]: restore purchase */ }} />
        </Animated.View>
      )}

      {/* ── Contenu scrollable ─────────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        // paddingTop généreux pour que le hero commence sous les boutons flottants
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 72 }}
      >
        {/* Hero */}
        <View className="items-center pb-[36px]">
          {/* Badge "PREMIUM EXPERIENCE" */}
          <View
            className="flex-row items-center px-[14px] py-[6px] rounded-full mb-[20px] border"
            style={{
              borderColor:     'rgba(255, 107, 26, 0.35)',
              backgroundColor: 'rgba(255, 107, 26, 0.08)',
            }}
          >
            <Text
              className="font-inter-bold text-label text-accent tracking-widest uppercase"
              style={{ includeFontPadding: false }}
            >
              {t('hero.badge')}
            </Text>
          </View>

          <Text
            className="font-space-bold text-display-l text-text-primary text-center mb-[12px]"
            style={{ includeFontPadding: false }}
          >
            {t('hero.title')}
          </Text>

          <Text className="font-inter-regular text-body-m text-text-secondary text-center leading-[24px] px-[8px]">
            {t('hero.subtitle')}
          </Text>
        </View>

        {/* Feature cards */}
        {features.map((feat, i) => (
          <FeatureCard key={i} {...feat} />
        ))}
      </ScrollView>

      {/* ── Footer fixe ────────────────────────────────────────────────── */}
      <View
        className="px-[24px] bg-background border-t border-subtle"
        style={{ paddingTop: 20, paddingBottom: insets.bottom + 8 }}
      >
        <Button
          label={t('cta.upgrade')}
          variant="primary"
          size="l"
          fullWidth
          rightIcon={ArrowRight}
          onPress={() => router.push('/(app)/(pro)/pricing' as any)}
        />
        <Text className="font-inter-regular text-body-s text-text-muted text-center mt-[12px]">
          {t('cta.trial')}
        </Text>
      </View>

    </SafeScreenView>
  );
}