import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Shield,
  Globe,
  ChevronRight,
  LogOut,
  HelpCircle,
  Mail,
  Share2,
  Lock,
  Crown,
  ExternalLink,
  Trash2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { Animation } from '@/constants/theme';
import { CONFIG } from '@/constants/config';
import { LANGUAGE_META, type SupportedLanguage } from '@/lib/i18n';
import { shareApp, contactSupport } from '@/utils/sharing.utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  isExternal?: boolean;
}

// ─── SettingsSection ──────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    // mb-[44px] : separation claire et respirable entre chaque bloc.
    // Valeur arbitraire pour contourner les eventuels conflits NativeWind/breakpoint.
    <View className="mb-[44px]">
      <Text className="text-label font-inter-semibold text-text-muted uppercase mb-[14px] px-4 tracking-widest">
        {title}
      </Text>
      <View className="bg-card mx-4 rounded-xl overflow-hidden border border-subtle">
        {children}
      </View>
    </View>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────

function SettingsRow({
  icon: Icon,
  iconColor = '#8BA3BE',
  label,
  sublabel,
  onPress,
  isExternal = false,
}: SettingsRowProps) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.97, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        // py-[18px] : rows plus hautes, moins etouffees
        className="flex-row items-center px-4 py-[18px] min-h-[64px]"
      >
        {/* bg dynamique (runtime hex+alpha) — inline style inevitable */}
        <View
          className="w-[38px] h-[38px] rounded-[12px] items-center justify-center mr-[12px]"
          style={{ backgroundColor: `${iconColor}1A` }}
        >
          <Icon size={18} color={iconColor} strokeWidth={1.8} />
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-body-m font-inter-medium text-text-primary">
            {label}
          </Text>
          {sublabel ? (
            <Text className="text-body-s font-inter-regular text-text-muted mt-[3px]">
              {sublabel}
            </Text>
          ) : null}
        </View>

        {isExternal
          ? <ExternalLink size={14} color="#4A6480" strokeWidth={1.8} />
          : <ChevronRight size={16} color="#4A6480" strokeWidth={1.8} />
        }
      </Pressable>
    </Animated.View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  // ml aligné sous le label : padding (16) + icone (38) + gap (12) = 66px
  return <View className="h-px bg-subtle ml-[66px]" />;
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');

  return (
    <LinearGradient
      colors={['#FF6B1A', '#FF3D00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <Text
        className="font-space-bold text-[16px] text-white"
        style={{ includeFontPadding: false, textAlignVertical: 'center' }}
      >
        {initials}
      </Text>
    </LinearGradient>
  );
}

// ─── ProBadge ─────────────────────────────────────────────────────────────────

function ProBadge() {
  return (
    <LinearGradient
      colors={['#FF6B1A', '#FF3D00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, gap: 3 }}
    >
      <Crown size={10} color="#fff" strokeWidth={2} />
      <Text
        className="font-inter-bold text-[10px] text-white"
        style={{ includeFontPadding: false }}
      >
        PRO
      </Text>
    </LinearGradient>
  );
}

// ─── VersionFooter ────────────────────────────────────────────────────────────

function VersionFooter({ version, build, copyright }: { version: string; build: string; copyright: string }) {
  return (
    <View className="items-center pb-[16px] pt-[8px] px-[16px]">
      <Text className="text-caption font-inter-regular text-text-muted text-center">
        ACTIO {version} (Build {build})
      </Text>
      <Text className="text-caption font-inter-regular text-text-muted text-center mt-[2px]">
        {copyright}
      </Text>
    </View>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t, i18n }      = useTranslation('settings');
  const router           = useRouter();
  const { user, logout } = useAuthStore();
  const isPro            = user?.isPro ?? false;

  const garantsCount    = 2;
  const garantsSublabel = t('sections.app.garants.subtitle', { count: garantsCount });
  const currentLanguageMeta = LANGUAGE_META[i18n.language as SupportedLanguage];
  const langSublabel    = `${currentLanguageMeta.nativeName} (${currentLanguageMeta.region})`;

  function handleLogout() {
    Alert.alert(t('logout.confirmTitle'), t('logout.confirmMessage'), [
      { text: t('logout.cancel'), style: 'cancel' },
      {
        text: t('logout.confirm'),
        style: 'destructive',
        onPress: () => { logout(); router.replace('/(auth)/login' as any); },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmMessage'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      {
        text: t('deleteAccount.confirm'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  }

  return (
    <SafeScreenView  withGradient>
      <ScreenHeader title={t('header.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // paddingTop genereux : le premier bloc ne colle pas au header
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 48 }}
      >
        {/* ── COMPTE ─────────────────────────────────────────────────────── */}
        <SettingsSection title={t('sections.account.title')}>
          <Pressable
            onPress={() => router.push('/(app)/(settings)/profile' as any)}
            // py-[22px] : la row profil (avec avatar 48px) a besoin de plus d'air
            className="flex-row items-center px-[16px] py-[22px]"
          >
            <UserAvatar name={user?.name ?? 'Adama Diallo'} />
            <View className="flex-1 ml-[12px] justify-center">
              <View className="flex-row items-center gap-[8px]">
                <Text
                  className="text-body-m font-inter-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {user?.name ?? 'Adama Diallo'}
                </Text>
                {isPro && <ProBadge />}
              </View>
              <Text
                className="text-body-s font-inter-regular text-text-secondary mt-[3px]"
                numberOfLines={1}
              >
                {user?.email ?? 'adama.diallo@actio.app'}
              </Text>
            </View>
            <ChevronRight size={16} color="#4A6480" strokeWidth={1.8} />
          </Pressable>

          <Divider />

          <SettingsRow
            icon={Crown}
            iconColor="#FF6B1A"
            label={t('sections.account.subscription.label')}
            sublabel={isPro
              ? t('sections.account.subscription.sublabelPro')
              : t('sections.account.subscription.sublabelFree')}
            onPress={() => router.push('/(pro)/features' as any)}
          />
        </SettingsSection>

        {/* ── APPLICATION ────────────────────────────────────────────────── */}
        <SettingsSection title={t('sections.app.title')}>
          <SettingsRow
            icon={Bell}
            iconColor="#4D9EFF"
            label={t('sections.app.notifications.label')}
            sublabel={t('sections.app.notifications.subtitle')}
            onPress={() => router.push('/(app)/(settings)/notifications' as any)}
          />
          <Divider />
          <SettingsRow
            icon={Shield}
            iconColor="#00D68F"
            label={t('sections.app.garants.label')}
            sublabel={garantsSublabel}
            onPress={() => router.push('/garants' as any)}
          />
          <Divider />
          <SettingsRow
            icon={Globe}
            iconColor="#8BA3BE"
            label={t('sections.app.language.label')}
            sublabel={langSublabel}
            onPress={() => router.push('/(app)/(settings)/language' as any)}
          />
        </SettingsSection>

        {/* ── AVANCÉ ─────────────────────────────────────────────────────── */}
        {/* Sync & Backup et AI & Automation retirés du MVP : pas de backend
            de synchronisation ni d'assistant IA réel pour l'instant — les
            afficher donnerait l'impression de fonctionnalités qui n'existent
            pas. À réintroduire une fois ces briques construites. */}
        <SettingsSection title={t('sections.advanced.title')}>
          <SettingsRow
            icon={Lock}
            iconColor="#FF6B1A"
            label={t('sections.advanced.permissions.label')}
            sublabel={t('sections.advanced.permissions.subtitle')}
            onPress={() => router.push('/(app)/(settings)/permissions' as any)}
          />
          <Divider />
          <SettingsRow
            icon={Lock}
            iconColor="#8BA3BE"
            label={t('sections.advanced.privacy.label')}
            sublabel={t('sections.advanced.privacy.subtitle')}
            onPress={() => router.push('/(app)/(settings)/privacy' as any)}
          />
        </SettingsSection>

        {/* ── SUPPORT ────────────────────────────────────────────────────── */}
        {/* Rate ACTIO retiré du MVP : pas encore de fiche store publiée,
            le lien serait cassé. À réintroduire au lancement. */}
        <SettingsSection title={t('sections.support.title')}>
          <SettingsRow
            icon={HelpCircle}
            iconColor="#8BA3BE"
            label={t('sections.support.help.label')}
            onPress={() => router.push('/(app)/(settings)/help' as any)}
          />
          <Divider />
          <SettingsRow
            icon={Mail}
            iconColor="#8BA3BE"
            label={t('sections.support.contact.label')}
            onPress={() => contactSupport(CONFIG.support.email)}
            isExternal
          />
          <Divider />
          <SettingsRow
            icon={Share2}
            iconColor="#8BA3BE"
            label={t('sections.support.share.label')}
            onPress={shareApp}
          />
        </SettingsSection>

        {/* ── DÉCONNEXION ────────────────────────────────────────────────── */}
        <View className="mx-[16px] mb-[12px]">
          <Button
            label={t('logout.label')}
            variant="danger"
            size="l"
            fullWidth
            leftIcon={LogOut}
            onPress={handleLogout}
          />
        </View>

        {/* ── SUPPRIMER MON COMPTE ───────────────────────────────────────── */}
        <View className="mx-[16px] mb-[32px]">
          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-center h-[46px] bg-deep rounded-[12px] gap-[8px]"
            style={{ borderWidth: 1, borderColor: 'rgba(255, 59, 92, 0.18)' }}
          >
            <Trash2 size={15} color="#FF3B5C" strokeWidth={1.8} />
            <Text
              className="font-inter-semibold text-[13px] text-danger"
              style={{ includeFontPadding: false }}
            >
              {t('deleteAccount.label')}
            </Text>
          </Pressable>
        </View>

        <VersionFooter
          version="v4.2.0-stable"
          build="20231024"
          copyright={t('footer.copyright')}
        />
      </ScrollView>
    </SafeScreenView>
  );
}