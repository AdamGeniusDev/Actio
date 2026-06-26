import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Clock } from 'lucide-react-native';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SUPPORTED_LANGUAGES, LANGUAGE_META, type SupportedLanguage } from '@/lib/i18n';
import { useLocalePrefsStore, type TimeFormat } from '@/stores/localePrefs.store';

// ─── IntroBanner ──────────────────────────────────────────────────────────────

function IntroBanner({ label }: { label: string }) {
  return (
    <View
      className="flex-row items-center gap-[10px] rounded-2xl px-[16px] py-[14px] mb-[28px] border"
      style={{ backgroundColor: 'rgba(77,158,255,0.08)', borderColor: 'rgba(77,158,255,0.2)' }}
    >
      <Globe size={16} color="#4D9EFF" strokeWidth={1.8} />
      <Text className="flex-1 font-inter-regular text-body-s text-info leading-[20px]">
        {label}
      </Text>
    </View>
  );
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon, iconColor, title, subtitle,
}: {
  icon:      React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  title:     string;
  subtitle:  string;
}) {
  return (
    <View className="flex-row items-start gap-[10px] mb-[14px] px-[2px]">
      <View
        className="w-[30px] h-[30px] rounded-[10px] items-center justify-center mt-[1px]"
        style={{ backgroundColor: `${iconColor}1A` }}
      >
        <Icon size={15} color={iconColor} strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-body-m text-text-primary">{title}</Text>
        <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">{subtitle}</Text>
      </View>
    </View>
  );
}

// ─── SelectCard — carte réutilisée pour langue & format heure ───────────────
// Sélection indiquée uniquement par un ring (bordure) — pas d'effet ni de glow.

function SelectCard({
  leading, label, sublabel, selected, onPress,
}: {
  leading:   React.ReactNode;
  label:     string;
  sublabel?: string;
  selected:  boolean;
  onPress:   () => void;
}) {
  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 rounded-2xl px-[16px] py-[16px] border"
      style={{
        backgroundColor: '#121E2E',
        borderColor:     selected ? '#FF6B1A' : '#1E3048',
        borderWidth:     selected ? 2 : 1,
      }}
    >
      <View className="mb-[10px]">
        {leading}
      </View>

      <Text
        className="font-inter-semibold text-body-m"
        style={{ color: selected ? '#FF6B1A' : '#F0F6FF', includeFontPadding: false }}
      >
        {label}
      </Text>
      {sublabel && (
        <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}

// ─── LanguageRegionScreen ─────────────────────────────────────────────────────

export default function LanguageRegionScreen() {
  const { t, i18n } = useTranslation('settings');
  const insets       = useSafeAreaInsets();

  const currentLanguage = i18n.language as SupportedLanguage;
  const timeFormat      = useLocalePrefsStore((s) => s.timeFormat);
  const setTimeFormat   = useLocalePrefsStore((s) => s.setTimeFormat);

  const timePreview = useMemo(() => ({
    '24h': dayjs().hour(14).minute(30).format('HH:mm'),
    '12h': dayjs().hour(14).minute(30).format('h:mm A'),
  }), []);

  function handleLanguageSelect(lang: SupportedLanguage) {
    if (lang === currentLanguage) return;
    i18n.changeLanguage(lang);
  }

  function handleTimeFormatSelect(format: TimeFormat) {
    if (format === timeFormat) return;
    setTimeFormat(format);
  }

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('languagePage.header.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 48 }}
      >
        <IntroBanner label={t('languagePage.intro')} />

        {/* ── Langue ───────────────────────────────────────────────────────── */}
        <View className="mb-[32px]">
          <SectionHeading
            icon={Globe}
            iconColor="#4D9EFF"
            title={t('languagePage.language.title')}
            subtitle={t('languagePage.language.subtitle')}
          />

          <View className="flex-row gap-[12px]">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const meta = LANGUAGE_META[lang];
              return (
                <SelectCard
                  key={lang}
                  selected={currentLanguage === lang}
                  onPress={() => handleLanguageSelect(lang)}
                  label={meta.nativeName}
                  sublabel={meta.region}
                  leading={
                    <View
                      className="w-[36px] h-[36px] rounded-[11px] items-center justify-center"
                      style={{ backgroundColor: '#172436' }}
                    >
                      <Text style={{ fontSize: 18 }}>{meta.flag}</Text>
                    </View>
                  }
                />
              );
            })}
          </View>
        </View>

        {/* ── Région — format de l'heure ──────────────────────────────────── */}
        <View className="mb-[8px]">
          <SectionHeading
            icon={Clock}
            iconColor="#00D68F"
            title={t('languagePage.region.title')}
            subtitle={t('languagePage.region.subtitle')}
          />

          <View className="flex-row gap-[12px]">
            <SelectCard
              selected={timeFormat === '24h'}
              onPress={() => handleTimeFormatSelect('24h')}
              label={t('languagePage.region.24h')}
              sublabel={timePreview['24h']}
              leading={
                <View
                  className="w-[36px] h-[36px] rounded-[11px] items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,214,143,0.12)' }}
                >
                  <Clock size={16} color="#00D68F" strokeWidth={1.8} />
                </View>
              }
            />
            <SelectCard
              selected={timeFormat === '12h'}
              onPress={() => handleTimeFormatSelect('12h')}
              label={t('languagePage.region.12h')}
              sublabel={timePreview['12h']}
              leading={
                <View
                  className="w-[36px] h-[36px] rounded-[11px] items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,214,143,0.12)' }}
                >
                  <Clock size={16} color="#00D68F" strokeWidth={1.8} />
                </View>
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeScreenView>
  );
}
