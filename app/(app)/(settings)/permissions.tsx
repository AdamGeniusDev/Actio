import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Linking, AppState } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
// ▶ expo-notifications — module natif, nécessite un build development pour
// être testé (même limitation que dans (onboarding)/permissions.tsx).
// import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import * as ExpoCalendar from 'expo-calendar/legacy';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  // Bell, // ← décommenter avec notifications
  Users,
  Calendar as CalendarIcon,
  MapPin,
  Image as ImageIcon,
  BatteryCharging,
  ChevronRight,
  Info,
  type LucideIcon,
} from 'lucide-react-native';

import { Shadows, Animation } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Badge } from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionKey  =
  // 'notifications' | // ← décommenter quand expo-notifications est buildé nativement
  'contacts' | 'calendar' | 'location' | 'photos';
type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionConfig {
  key:       PermissionKey;
  icon:      LucideIcon;
  iconColor: string;
}

const PERMISSIONS: PermissionConfig[] = [
  // { key: 'notifications', icon: Bell, iconColor: '#FF6B1A' }, // ← décommenter avec notifications
  { key: 'contacts',      icon: Users,       iconColor: '#4D9EFF' },
  { key: 'calendar',      icon: CalendarIcon, iconColor: '#00D68F' },
  { key: 'location',      icon: MapPin,      iconColor: '#4D9EFF' },
  { key: 'photos',        icon: ImageIcon,   iconColor: '#FFB800' },
];

const PERMISSION_HANDLERS: Record<PermissionKey, {
  check:   () => Promise<{ status: PermissionStatus; canAskAgain: boolean }>;
  request: () => Promise<{ status: PermissionStatus; canAskAgain: boolean }>;
}> = {
  // ── Décommenter quand expo-notifications est installé et branché ──────────
  // notifications: {
  //   check:   async () => toResult(await Notifications.getPermissionsAsync()),
  //   request: async () => toResult(await Notifications.requestPermissionsAsync()),
  // },
  // ─────────────────────────────────────────────────────────────────────────
  contacts: {
    check:   async () => toResult(await Contacts.getPermissionsAsync()),
    request: async () => toResult(await Contacts.requestPermissionsAsync()),
  },
  calendar: {
    check:   async () => toResult(await ExpoCalendar.getCalendarPermissionsAsync()),
    request: async () => toResult(await ExpoCalendar.requestCalendarPermissionsAsync()),
  },
  location: {
    check:   async () => toResult(await Location.getForegroundPermissionsAsync()),
    request: async () => toResult(await Location.requestForegroundPermissionsAsync()),
  },
  photos: {
    check:   async () => toResult(await ImagePicker.getMediaLibraryPermissionsAsync()),
    request: async () => toResult(await ImagePicker.requestMediaLibraryPermissionsAsync()),
  },
};

function toResult(res: { status: string; canAskAgain?: boolean }): { status: PermissionStatus; canAskAgain: boolean } {
  const status: PermissionStatus = res.status === 'granted'
    ? 'granted'
    : res.status === 'denied' ? 'denied' : 'undetermined';
  return { status, canAskAgain: res.canAskAgain ?? true };
}

async function openBatterySettings() {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
    );
  } catch {
    await Linking.openSettings();
  }
}

// ─── PermissionRow ────────────────────────────────────────────────────────────

function PermissionRow({
  icon: Icon, iconColor, title, subtitle, status, statusLabel, loading, onPress,
}: {
  icon:        LucideIcon;
  iconColor:   string;
  title:       string;
  subtitle:    string;
  status:      PermissionStatus | null;
  statusLabel: string;
  loading:     boolean;
  onPress:     () => void;
}) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={()  => { scale.value = withSpring(0.98, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        className="flex-row items-center px-[16px] py-[16px] min-h-[64px]"
      >
        <View
          className="w-[38px] h-[38px] rounded-[12px] items-center justify-center mr-[12px]"
          style={{ backgroundColor: `${iconColor}1A` }}
        >
          <Icon size={18} color={iconColor} strokeWidth={1.8} />
        </View>

        <View className="flex-1 mr-[10px]">
          <Text className="font-inter-medium text-body-m text-text-primary">{title}</Text>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">{subtitle}</Text>
        </View>

        {status && (
          <Badge
            label={statusLabel}
            variant={status === 'granted' ? 'success' : status === 'denied' ? 'danger' : 'ghost'}
          />
        )}
        <ChevronRight size={16} color="#4A6480" strokeWidth={1.8} style={{ marginLeft: 8 }} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <View className="h-px bg-subtle ml-[66px]" />;
}

// ─── PermissionsScreen ────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const { t }  = useTranslation('settings');
  const insets = useSafeAreaInsets();

  const [statuses, setStatuses] = useState<Partial<Record<PermissionKey, PermissionStatus>>>({});
  const [loadingKey, setLoadingKey] = useState<PermissionKey | null>(null);

  const refreshStatuses = useCallback(async () => {
    const keys = PERMISSIONS.map((p) => p.key);
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          return [key, (await PERMISSION_HANDLERS[key].check()).status] as const;
        } catch {
          return [key, 'undetermined' as PermissionStatus] as const;
        }
      }),
    );
    setStatuses(Object.fromEntries(results));
  }, []);

  // Vérifie au montage, et à chaque retour au premier plan — l'utilisateur a
  // pu changer une permission depuis les réglages système entre-temps.
  useEffect(() => {
    refreshStatuses();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshStatuses();
    });
    return () => sub.remove();
  }, [refreshStatuses]);

  async function handlePress(key: PermissionKey) {
    if (statuses[key] === 'granted') {
      Linking.openSettings();
      return;
    }

    setLoadingKey(key);
    try {
      const { status, canAskAgain } = await PERMISSION_HANDLERS[key].request();
      setStatuses((prev) => ({ ...prev, [key]: status }));
      if (status !== 'granted' && !canAskAgain) {
        Linking.openSettings();
      }
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <SafeScreenView withGradient>
      <ScreenHeader title={t('permissionsPage.header.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 48 }}
      >
        <View
          className="flex-row items-start gap-[10px] rounded-2xl px-[16px] py-[14px] mb-[24px] border"
          style={{ backgroundColor: 'rgba(77,158,255,0.08)', borderColor: 'rgba(77,158,255,0.2)' }}
        >
          <Info size={16} color="#4D9EFF" strokeWidth={1.8} style={{ marginTop: 1 }} />
          <Text className="flex-1 font-inter-regular text-body-s text-info leading-[20px]">
            {t('permissionsPage.intro')}
          </Text>
        </View>

        <View className="bg-card rounded-2xl overflow-hidden border border-subtle" style={Shadows.card}>
          {PERMISSIONS.map((perm, i) => (
            <View key={perm.key}>
              {i > 0 && <Divider />}
              <PermissionRow
                icon={perm.icon}
                iconColor={perm.iconColor}
                title={t(`permissionsPage.items.${perm.key}.title`)}
                subtitle={t(`permissionsPage.items.${perm.key}.subtitle`)}
                status={statuses[perm.key] ?? null}
                statusLabel={t(`permissionsPage.status.${statuses[perm.key] ?? 'undetermined'}`)}
                loading={loadingKey === perm.key}
                onPress={() => handlePress(perm.key)}
              />
            </View>
          ))}

          {Platform.OS === 'android' && (
            <View>
              <Divider />
              <PermissionRow
                icon={BatteryCharging}
                iconColor="#FFB800"
                title={t('permissionsPage.items.battery.title')}
                subtitle={t('permissionsPage.items.battery.subtitle')}
                status={null}
                statusLabel=""
                loading={false}
                onPress={openBatterySettings}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreenView>
  );
}
