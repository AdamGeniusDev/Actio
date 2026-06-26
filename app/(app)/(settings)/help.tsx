import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Mail } from 'lucide-react-native';

import { Shadows } from '@/constants/theme';
import { CONFIG } from '@/constants/config';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { contactSupport } from '@/utils/sharing.utils';

const FAQ_KEYS = ['garant', 'alarm', 'delay', 'notifications', 'language'] as const;

// ─── FaqItem ──────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="px-[16px] py-[15px]"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-inter-medium text-body-m text-text-primary mr-[10px]">
          {question}
        </Text>
        <Animated.View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color="#4A6480" strokeWidth={1.8} />
        </Animated.View>
      </View>

      {expanded && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[8px] leading-[20px]">
            {answer}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

// ─── HelpScreen ───────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const { t }  = useTranslation('settings');
  const insets = useSafeAreaInsets();

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('helpPage.header.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 48 }}
      >
        <Text className="font-inter-regular text-body-s text-text-muted mb-[20px] px-[2px]">
          {t('helpPage.intro')}
        </Text>

        <View className="bg-card rounded-2xl overflow-hidden border border-subtle mb-[24px]" style={Shadows.card}>
          {FAQ_KEYS.map((key, i) => (
            <View key={key}>
              {i > 0 && <View className="h-px bg-subtle mx-[16px]" />}
              <FaqItem
                question={t(`helpPage.faq.${key}.q`)}
                answer={t(`helpPage.faq.${key}.a`)}
              />
            </View>
          ))}
        </View>

        <View className="items-center">
          <Text className="font-inter-regular text-body-s text-text-muted mb-[12px]">
            {t('helpPage.contactFooter')}
          </Text>
          <Pressable
            onPress={() => contactSupport(CONFIG.support.email)}
            className="flex-row items-center gap-[8px] px-[18px] py-[10px] rounded-full border"
            style={{ borderColor: 'rgba(255,107,26,0.3)', backgroundColor: 'rgba(255,107,26,0.08)' }}
          >
            <Mail size={15} color="#FF6B1A" strokeWidth={1.8} />
            <Text className="font-inter-semibold text-body-s text-accent">
              {CONFIG.support.email}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeScreenView>
  );
}
