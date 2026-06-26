import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';

import { Animation, Gradients, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { GlowBackground, type GlowBlobConfig } from '@/components/ui/GlowBackground';

// ─── Config des lueurs — C'EST ICI QUE TU PERSONNALISES TOUT ─────────────────
// Touche uniquement ce tableau pour changer couleurs, tailles, positions,
// intensité ou vitesse. Le reste du fichier n'a pas besoin de changer.
//
//   color       → n'importe quelle couleur hex
//   size        → diamètre en px. Plus grand = lueur plus douce et étalée.
//                 Plus petit = lueur plus concentrée, presque un point.
//   peakOpacity → 0 à 1, intensité de la couleur au centre du blob.
//                 0.2-0.3 = voile discret · 0.5-0.65 = couleur franche.
//   top / left  → position du coin HAUT-GAUCHE de la zone du blob (pas le
//                 centre !). Pour centrer un blob à un point précis :
//                 top  = centreY - size / 2
//                 left = centreX - size / 2
//                 Tu peux utiliser width/height (passés en argument) pour
//                 des positions relatives à l'écran plutôt que des px fixes.
//   rangeX/Y    → amplitude du mouvement de dérive en px (le blob oscille
//                 entre -range et +range autour de sa position de base).
//   duration    → vitesse de l'aller simple en ms. Plus petit = plus rapide.

function getGlowBlobs(width: number, height: number): GlowBlobConfig[] {
  return [
    {
      id: 'glowOrange',
      color: '#FF6B1A',
      size: 480,
      peakOpacity: 0.55,
      top: -140,
      left: -150,
      rangeX: 30,
      rangeY: 22,
      duration: 9000,
    },
    {
      id: 'glowGreen',
      color: '#00D68F',
      size: 540,
      peakOpacity: 0.6,
      top: height * 0.08,
      left: width / 2 - 270, // centré horizontalement (270 = size/2)
      rangeX: 26,
      rangeY: 34,
      duration: 7200,
    },
    {
      id: 'glowGold',
      color: '#FFB800',
      size: 490,
      peakOpacity: 0.45,
      top: height * 0.56 - 25,
      left: width - 285,
      rangeX: 34,
      rangeY: 24,
      duration: 10400,
    },
    {
      id: 'glowGreen2',
      color: '#00D68F',
      size: 450,
      peakOpacity: 0.34,
      top: height * 0.74 - 25,
      left: -155,
      rangeX: 28,
      rangeY: 20,
      duration: 8200,
    },
    // Pour ajouter un 5e blob, copie-colle un objet ci-dessus et change l'id.
  ];
}

const STATIC_SPARKLES: { top: number; left: number; size: number; color: string }[] = [
  { top: 70,  left: 48,  size: 5, color: 'rgba(255,255,255,0.25)' },
  { top: 130, left: 290, size: 4, color: 'rgba(255,107,26,0.35)'  },
  { top: 240, left: 36,  size: 6, color: 'rgba(0,214,143,0.28)'   },
  { top: 90,  left: 230, size: 3, color: 'rgba(255,255,255,0.20)' },
  { top: 320, left: 270, size: 4, color: 'rgba(0,214,143,0.30)'   },
];

function AmbientBackground() {
  return (
    <>
      <GlowBackground blobs={getGlowBlobs} />
      {/* Petits points nets, par-dessus les lueurs */}
      {STATIC_SPARKLES.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position:     'absolute',
            top:          d.top,
            left:         d.left,
            width:        d.size,
            height:       d.size,
            borderRadius: d.size / 2,
            backgroundColor: d.color,
          }}
        />
      ))}
    </>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────

export default function SuccessScreen() {
  const { t, i18n } = useTranslation('pro');
  const router  = useRouter();
  const params  = useLocalSearchParams<{ plan?: string }>();

  const plan = params.plan === 'monthly' ? 'monthly' : 'yearly';

  // ── Date du prochain prélèvement (fin d'essai, J+7) ─────────────────────
  const nextBillingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [i18n.language]);

  // ── Entrée du badge (spring) ─────────────────────────────────────────────
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, Animation.spring.snappy);
  }, []);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // ── Halo qui pulse doucement autour du badge ─────────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 }),
      ),
      -1,
      false,
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    opacity:   0.15 + pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#080D14' }}>
      <AmbientBackground />

      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center px-[32px]">

          {/* ── Badge de succès + halo ───────────────────────────────────── */}
          <View
            className="items-center justify-center mb-[32px]"
            style={{ width: 160, height: 160 }}
          >
            <Animated.View
              style={[
                ringStyle,
                {
                  position:     'absolute',
                  width:        152,
                  height:       152,
                  borderRadius: 76,
                  borderWidth:  1.5,
                  borderColor:  'rgba(0,214,143,0.55)',
                },
              ]}
            />
            <Animated.View style={iconStyle}>
              <LinearGradient
                colors={Gradients.success.colors}
                start={Gradients.success.start}
                end={Gradients.success.end}
                style={{
                  width: 88, height: 88, borderRadius: 44,
                  alignItems: 'center', justifyContent: 'center',
                  ...Shadows.success,
                }}
              >
                <CheckCircle2 size={42} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* ── Titre & sous-titre ───────────────────────────────────────── */}
          <Text
            className="font-space-bold text-display-l text-text-primary text-center mb-[12px]"
            style={{ includeFontPadding: false }}
          >
            {t('success.title')}
          </Text>

          <Text className="font-inter-regular text-body-m text-text-secondary text-center leading-[24px] mb-[32px]">
            {t('success.subtitle')}
          </Text>

          {/* ── Mini récap ───────────────────────────────────────────────── */}
          <View
            className="w-full rounded-2xl px-[24px] py-[22px] mb-[32px]"
            style={{
              backgroundColor: 'rgba(18,30,46,0.78)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View className="flex-row justify-between items-center">
              <Text className="font-inter-medium text-body-s text-text-secondary">
                {t('success.plan')}
              </Text>
              <Text className="font-inter-bold text-body-m text-accent">
                {t(`checkout.summary.planLabel.${plan}`)}
              </Text>
            </View>

            <View className="h-px my-[16px]" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

            <View className="flex-row justify-between items-center">
              <Text className="font-inter-medium text-body-s text-text-secondary">
                {t('success.nextBilling')}
              </Text>
              <Text className="font-inter-bold text-body-m text-text-primary">
                {nextBillingDate}
              </Text>
            </View>
          </View>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <Button
            label={t('success.cta')}
            variant="primary"
            size="l"
            fullWidth
            onPress={() => router.replace('/(app)/(home)' as any)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}