// app/(auth)/onboarding/index.tsx
import { useEffect } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Animation } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
// ↓ Ajuste le chemin selon ton fichier i18n
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';
import { Logo } from '@/components/ui/Logo';

// ─── Config preview ────────────────────────────────────────────────────────────

const PREVIEW_W = 204;
const PREVIEW_H = 338;

interface TabItem {
  icon?: string;
  label?: string;
  active?: boolean;
  cta?: boolean;
}

const TAB_ITEMS: TabItem[] = [
  { icon: '🏠', label: 'Home', active: true },
  { icon: '📅', label: 'Week' },
  { cta: true },
  { icon: '📊', label: 'Stats' },
  { icon: '⚙️', label: 'Régl.' },
];

// ─── DashboardPreview ──────────────────────────────────────────────────────────

function DashboardPreview() {
  const { t } = useTranslation('onboarding');

  // ── Tâches mock — recalculées à chaque changement de langue ──
  const tasks = [
    { title: 'Review Launch Strategy', sub: t('preview.task1Sub'), color: '#FF9500', done: false },
    { title: 'Check morning emails',   sub: t('preview.task2Sub'), color: '#4ade80', done: true  },
  ];

  // ── Animations ──
  //
  // floatY initialisé à -7 (haut de la plage) pour que withRepeat + reverse:true
  // fasse un ping-pong parfait -7 ↔ +7 sans aucun saut.
  //
  // L'ancien pattern withSequence(-7, 7) causait un saut brutal car withRepeat
  // repart de la valeur initiale (0) à chaque itération, pas de la valeur courante.
  const floatY    = useSharedValue(-7);
  const mountY    = useSharedValue(24);
  const mountOp   = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    // Mount : apparition depuis le bas
    mountOp.value = withTiming(1, { duration: 600 });
    mountY.value  = withSpring(0, { damping: 18, stiffness: 120 });

    // Float démarré avec délai pour ne pas se superposer au mount.
    // reverse:true → ping-pong -7 ↔ +7, aucun discontinuité possible.
    const floatTimer = setTimeout(() => {
      floatY.value = withRepeat(
        withTiming(7, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true, // ← ping-pong : -7 → 7 → -7 → 7 ...
      );
    }, 700);

    // Glow : séquence 0→1→0 se répète depuis 0, aucun saut
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );

    return () => {
      clearTimeout(floatTimer);
      cancelAnimation(floatY);
      cancelAnimation(mountY);
      cancelAnimation(mountOp);
      cancelAnimation(glowPulse);
    };
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value + mountY.value }],
    opacity: mountOp.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(glowPulse.value, [0, 1], [0.08, 0.22]),
    transform: [{ scaleX: interpolate(glowPulse.value, [0, 1], [0.88, 1.12]) }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center' }, wrapStyle]}>

      {/* Ambient glow */}
      <Animated.View style={[{
        position: 'absolute', bottom: -14,
        width: PREVIEW_W * 0.85, height: 22, borderRadius: 40,
        backgroundColor: '#FF6B1A',
      }, glowStyle]} />

      {/* Cadre téléphone */}
      <View style={{
        width: PREVIEW_W, height: PREVIEW_H,
        borderRadius: 26, overflow: 'hidden',
        backgroundColor: '#0C1220',
        borderWidth: 1.5, borderColor: 'rgba(255,107,26,0.28)',
        ...Platform.select({
          ios: {
            shadowColor:   '#FF6B1A',
            shadowOffset:  { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius:  20,
          },
          android: { elevation: 14 },
        }),
      }}>

        {/* Notch */}
        <View style={{
          height: 12, backgroundColor: '#080E15',
          alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3,
        }}>
          <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 6 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: '#FF6B1A',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>AD</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600', flex: 1 }}>
            {t('preview.greeting')}
          </Text>
          <Text style={{ fontSize: 9 }}>🔔</Text>
        </View>

        {/* Votre journée */}
        <View style={{ marginHorizontal: 8, backgroundColor: '#131D2E', borderRadius: 12, padding: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ color: '#556677', fontSize: 6.5 }}>{t('preview.date')}</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 2,
              backgroundColor: 'rgba(255,107,26,0.15)',
              paddingHorizontal: 4, paddingVertical: 2, borderRadius: 5,
            }}>
              <Text style={{ fontSize: 7 }}>🔥</Text>
              <Text style={{ color: '#FF6B1A', fontSize: 6.5, fontWeight: '700' }}>7j</Text>
            </View>
          </View>

          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginBottom: 4 }}>
            {t('preview.yourDay')}
          </Text>

          <View style={{ flexDirection: 'row', gap: 7, marginBottom: 4 }}>
            {[
              { color: '#4ade80', label: t('preview.completed', { count: 3 }) },
              { color: '#FF9500', label: t('preview.inProgress', { count: 2 }) },
            ].map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: s.color }} />
                <Text style={{ color: '#7a8a9a', fontSize: 6 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Barre de progression */}
          <View style={{ height: 3, backgroundColor: '#1e2d3d', borderRadius: 2 }}>
            <View style={{ width: '37%', height: '100%', backgroundColor: '#FF6B1A', borderRadius: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
            <Text style={{ color: '#FF6B1A', fontSize: 6.5, fontWeight: '700' }}>37%</Text>
          </View>
        </View>

        {/* MAINTENANT */}
        <View style={{ marginHorizontal: 8, marginTop: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF6B1A' }} />
            <Text style={{ color: '#FF6B1A', fontSize: 6, fontWeight: '800', letterSpacing: 1 }}>
              {t('preview.now')}
            </Text>
          </View>

          <View style={{ backgroundColor: '#FF6B1A', borderRadius: 11, padding: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 5 }}>
              <View style={{
                width: 20, height: 20, borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.22)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 10 }}>📞</Text>
              </View>
              <View>
                <Text style={{ color: '#fff', fontSize: 8.5, fontWeight: '800' }}>Client Feedback Call</Text>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 6 }}>
                  {t('preview.reminderMeta')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[
                { label: t('preview.callAction'),     op: 0.30 },
                { label: t('preview.postponeAction'), op: 0.18 },
              ].map((btn, i) => (
                <View key={i} style={{
                  flex: 1,
                  backgroundColor: `rgba(0,0,0,${btn.op})`,
                  borderRadius: 6, paddingVertical: 4, alignItems: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 7, fontWeight: i === 0 ? '600' : '400' }}>
                    {btn.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Mes tâches */}
        <View style={{ marginHorizontal: 8, marginTop: 7 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: '#fff', fontSize: 8.5, fontWeight: '700' }}>
              {t('preview.myTasks')}
            </Text>
            <Text style={{ color: '#FF6B1A', fontSize: 6.5 }}>
              {t('preview.seeAll')}
            </Text>
          </View>

          {tasks.map((task, i) => (
            <View key={i} style={{
              backgroundColor: '#131D2E', borderRadius: 8, padding: 6,
              borderLeftWidth: 2, borderLeftColor: task.color,
              marginBottom: i === 0 ? 4 : 0,
            }}>
              <Text style={{
                color: task.done ? task.color : '#fff',
                fontSize: 7.5, fontWeight: '700',
                textDecorationLine: task.done ? 'line-through' : 'none',
                marginBottom: 1,
              }}>
                {task.title}
              </Text>
              <Text style={{ color: '#4a5a6a', fontSize: 6 }}>{task.sub}</Text>
            </View>
          ))}
        </View>

        {/* Tab bar */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
          backgroundColor: '#080E15',
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
          paddingBottom: 3,
        }}>
          {TAB_ITEMS.map((tab, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 1 }}>
              {tab.cta ? (
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#FF6B1A',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 13, lineHeight: 15 }}>+</Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 10 }}>{tab.icon}</Text>
                  <Text style={{
                    color: tab.active ? '#FF6B1A' : '#334455',
                    fontSize: 5.5,
                    fontWeight: tab.active ? '700' : '400',
                  }}>
                    {tab.label}
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── WelcomeScreen ─────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation('onboarding');
  const currentLang = i18n.language as SupportedLanguage;

  const cardY       = useSharedValue(60);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      cardY.value       = withSpring(0, Animation.spring.sheet);
      cardOpacity.value = withTiming(1, { duration: 400 });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <SafeScreenView withTabBar={false} className="flex-1 bg-background">

      {/* ── Logo ── */}
      <View className="items-center pt-4 gap-1">
        <Text className="text-text-primary font-clash-bold text-2xl tracking-[4px]">
          <Logo size={28} />
        </Text>
        <Text className="text-text-muted font-inter-medium text-[10px] tracking-[3px]">
          {t('welcome.tagline')}
        </Text>
      </View>

      {/* ── Dashboard Preview ── */}
      <View style={{ flex: 1, alignItems: 'center' }} className="pt-7">
        <DashboardPreview />
      </View>

      {/* ── Bottom card ── */}
      <Animated.View
        className="bg-deep border-t border-border rounded-t-[28px] px-6 py-5 gap-[14px]"
        style={cardStyle}
      >
        <Text className="text-text-primary font-space-bold text-[28px] leading-[34px]">
          {t('welcome.headline')}
        </Text>

        <Text className="text-text-secondary font-inter-regular text-[14px] leading-6">
          {t('welcome.description')}
        </Text>

        {/* ── Sélecteur de langue — connecté à i18n ── */}
        <View className="flex-row gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => i18n.changeLanguage(lang)}
              className={`px-4 py-[7px] rounded-full border ${
                currentLang === lang
                  ? 'bg-accent border-accent'
                  : 'bg-transparent border-border'
              }`}
            >
              <Text className={`font-inter-medium text-[13px] ${
                currentLang === lang ? 'text-white' : 'text-text-secondary'
              }`}>
                {t(`welcome.languages.${lang}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          variant="primary"
          size="l"
          fullWidth
          label={t('welcome.cta')}
          onPress={() => router.push('/(onboarding)/permissions' as any)}
        />

        <View className="flex-row justify-center gap-1.5 mt-1">
          <View className="w-5 h-1.5 rounded-[3px] bg-accent" />
          <View className="w-1.5 h-1.5 rounded-full bg-border" />
          <View className="w-1.5 h-1.5 rounded-full bg-border" />
        </View>

        <Button
          variant="ghost"
          size="m"
          label={t('welcome.login')}
          onPress={() => router.push('/(auth)/login' as any)}
        />
      </Animated.View>
    </SafeScreenView>
  );
}