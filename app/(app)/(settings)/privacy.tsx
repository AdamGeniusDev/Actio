import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Database, Users2, Lock, Trash2, ChevronRight, CreditCard, Rocket, Scale, Mail,
  type LucideIcon,
} from 'lucide-react-native';

import { Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

// ─── PrivacySection ───────────────────────────────────────────────────────────

function PrivacySection({
  icon: Icon, iconColor, title, body, cta, onPressCta,
}: {
  icon:        LucideIcon;
  iconColor:   string;
  title:       string;
  body:        string;
  cta?:        string;
  onPressCta?: () => void;
}) {
  return (
    <View className="bg-card rounded-2xl p-[16px] mb-[14px] border border-subtle" style={Shadows.card}>
      <View className="flex-row items-center gap-[10px] mb-[8px]">
        <View
          className="w-[32px] h-[32px] rounded-[10px] items-center justify-center"
          style={{ backgroundColor: `${iconColor}1A` }}
        >
          <Icon size={16} color={iconColor} strokeWidth={1.8} />
        </View>
        <Text className="font-inter-semibold text-body-m text-text-primary flex-1">{title}</Text>
      </View>
      <Text className="font-inter-regular text-body-s text-text-secondary leading-[20px]">
        {body}
      </Text>
      {cta && (
        <Pressable
          onPress={onPressCta}
          className="flex-row items-center gap-[4px] mt-[12px] self-start"
        >
          <Text className="font-inter-semibold text-body-s text-accent">{cta}</Text>
          <ChevronRight size={14} color="#FF6B1A" strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

// ─── PrivacyScreen ────────────────────────────────────────────────────────────

export default function PrivacyScreen() {
  const { t }  = useTranslation('settings');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('privacyPage.header.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 48 }}
      >
        <Text className="font-inter-regular text-body-s text-text-muted mb-[20px] px-[2px]">
          {t('privacyPage.intro')}
        </Text>

        <PrivacySection
          icon={Database}
          iconColor="#4D9EFF"
          title={t('privacyPage.sections.storage.title')}
          body={t('privacyPage.sections.storage.body')}
        />
        <PrivacySection
          icon={Users2}
          iconColor="#8BA3BE"
          title={t('privacyPage.sections.collected.title')}
          body={t('privacyPage.sections.collected.body')}
        />
        <PrivacySection
          icon={Lock}
          iconColor="#FF6B1A"
          title={t('privacyPage.sections.permissions.title')}
          body={t('privacyPage.sections.permissions.body')}
          cta={t('privacyPage.sections.permissions.cta')}
          onPressCta={() => router.push('/(app)/(settings)/permissions' as any)}
        />
        <PrivacySection
          icon={CreditCard}
          iconColor="#FFB800"
          title={t('privacyPage.sections.payments.title')}
          body={t('privacyPage.sections.payments.body')}
        />
        <PrivacySection
          icon={Users2}
          iconColor="#00D68F"
          title={t('privacyPage.sections.sharing.title')}
          body={t('privacyPage.sections.sharing.body')}
        />
        <PrivacySection
          icon={Rocket}
          iconColor="#4D9EFF"
          title={t('privacyPage.sections.future.title')}
          body={t('privacyPage.sections.future.body')}
        />
        <PrivacySection
          icon={Scale}
          iconColor="#00D68F"
          title={t('privacyPage.sections.rights.title')}
          body={t('privacyPage.sections.rights.body')}
        />
        <PrivacySection
          icon={Trash2}
          iconColor="#FF3B5C"
          title={t('privacyPage.sections.deletion.title')}
          body={t('privacyPage.sections.deletion.body')}
        />
        <PrivacySection
          icon={Mail}
          iconColor="#8BA3BE"
          title={t('privacyPage.sections.contact.title')}
          body={t('privacyPage.sections.contact.body')}
        />
      </ScrollView>
    </SafeScreenView>
  );
}
