import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, FlatList, Platform, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Info,
  BatteryCharging,
  // Bell,     // ← décommenter avec notifications
  Users,
  Calendar as CalendarIcon,
  MapPin,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import * as Contacts from 'expo-contacts';
import * as ExpoCalendar from 'expo-calendar/legacy';
import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';

import { Animation } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { BackButton } from '@/components/ui/BackButton';

// ── Types ────────────────────────────────────────────────────────────────

type PermissionKey =
  | 'battery'
  // | 'notifications' // ← décommenter quand expo-notifications est branché
  | 'contacts'
  | 'calendar'
  | 'location';

/**
 * Config statique : icônes, couleurs, comportement.
 * Aucun texte ici — tout vient des traductions.
 */
interface PermissionConfig {
  key: PermissionKey;
  icon: LucideIcon;
  iconBgClass: string;
  iconColor: string;
  essential?: boolean;
  hasBadge?: boolean;
  badgeVariant?: 'accent' | 'warning';
}

/**
 * Objet complet passé aux cartes — config + textes traduits.
 */
interface PermissionItem extends PermissionConfig {
  title: string;
  subtitle: string;
  description: string;
  badge?: { label: string; variant: 'accent' | 'warning' };
}

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

interface PermissionHandler {
  /** null = statut non vérifiable sans module natif dédié */
  check: () => Promise<boolean | null>;
  request: () => Promise<PermissionResult>;
}

// ── Config statique (sans texte) ─────────────────────────────────────────

const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: 'battery',
    icon: BatteryCharging,
    iconBgClass: 'bg-warning-muted',
    iconColor: '#FFB800',
    essential: true,
    hasBadge: true,
    badgeVariant: 'accent',
  },
  // ── Décommenter quand expo-notifications est installé et branché ──────────
  // {
  //   key: 'notifications',
  //   icon: Bell,
  //   iconBgClass: 'bg-accent-muted',
  //   iconColor: '#FF6B1A',
  //   essential: true,
  //   hasBadge: true,
  //   badgeVariant: 'accent',
  // },
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: 'contacts',
    icon: Users,
    iconBgClass: 'bg-info-muted',
    iconColor: '#4D9EFF',
  },
  {
    key: 'calendar',
    icon: CalendarIcon,
    iconBgClass: 'bg-success-muted',
    iconColor: '#00D68F',
  },
  {
    key: 'location',
    icon: MapPin,
    iconBgClass: 'bg-info-muted',
    iconColor: '#4D9EFF',
  },
];

// ── Handlers de permissions ──────────────────────────────────────────────

const PERMISSION_HANDLERS: Record<PermissionKey, PermissionHandler> = {
  battery: {
    check: async () => null,
    request: async () => {
      if (Platform.OS === 'android') {
        try {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
          );
        } catch {
          await Linking.openSettings();
        }
      }
      return { granted: true, canAskAgain: true };
    },
  },
  // ── Décommenter quand expo-notifications est installé et branché ──────────
  // import * as Notifications from 'expo-notifications'; à ajouter en haut
  // notifications: {
  //   check: async () => {
  //     const { status } = await Notifications.getPermissionsAsync();
  //     return status === 'granted';
  //   },
  //   request: async () => {
  //     const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
  //     return { granted: status === 'granted', canAskAgain };
  //   },
  // },
  // ─────────────────────────────────────────────────────────────────────────
  contacts: {
    check: async () => (await Contacts.getPermissionsAsync()).status === 'granted',
    request: async () => {
      const res = await Contacts.requestPermissionsAsync();
      return { granted: res.status === 'granted', canAskAgain: res.canAskAgain };
    },
  },
  calendar: {
    check: async () => (await ExpoCalendar.getCalendarPermissionsAsync()).status === 'granted',
    request: async () => {
      const res = await ExpoCalendar.requestCalendarPermissionsAsync();
      return { granted: res.status === 'granted', canAskAgain: res.canAskAgain };
    },
  },
  location: {
    check: async () => (await Location.getForegroundPermissionsAsync()).status === 'granted',
    request: async () => {
      const res = await Location.requestForegroundPermissionsAsync();
      return { granted: res.status === 'granted', canAskAgain: res.canAskAgain };
    },
  },
};

// ── Subcomponents ────────────────────────────────────────────────────────
function ProgressDots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <View className="flex-row items-center gap-xs">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${
            i === activeIndex ? 'w-6 bg-accent' : 'w-1.5 bg-border'
          }`}
        />
      ))}
    </View>
  );
}

function PermissionCard({
  item,
  value,
  loading,
  expanded,
  whyNeededLabel,
  onToggle,
  onToggleExpand,
}: {
  item: PermissionItem;
  value: boolean;
  loading: boolean;
  expanded: boolean;
  whyNeededLabel: string;
  onToggle: () => void;
  onToggleExpand: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = item.icon;

  return (
    <Animated.View
      style={[
        aStyle,
        item.essential && {
          shadowColor: '#FF6B1A',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3,
        },
      ]}
    >
      <Pressable
        onPress={onToggle}
        onPressIn={() => { scale.value = withSpring(0.98, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        className={`bg-card rounded-lg py-lg px-md border overflow-hidden gap-md ${
          item.essential ? 'border-accent/50 border-2' : 'border-border'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-md flex-1 pr-md">
            <View className={`w-12 h-12 rounded-md items-center justify-center ${item.iconBgClass}`}>
              <Icon size={22} color={item.iconColor} />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-sm">
                <Text className="font-inter-semibold text-body-m text-text-primary">
                  {item.title}
                </Text>
                {item.badge && <Badge label={item.badge.label} variant={item.badge.variant} />}
              </View>
              <Text className="font-inter-regular text-body-s text-text-secondary">
                {item.subtitle}
              </Text>
            </View>
          </View>
          <Toggle value={value} onChange={onToggle} disabled={loading} />
        </View>

        <Pressable
          onPress={onToggleExpand}
          className="flex-row items-center gap-xs self-start my-2"
          hitSlop={15}
        >
          <Info size={12} color="#4A6480" />
          <Text className="font-inter-medium text-caption text-text-muted">
            {whyNeededLabel}
          </Text>
          {expanded
            ? <ChevronUp size={12} color="#4A6480" />
            : <ChevronDown size={12} color="#4A6480" />}
        </Pressable>

        {expanded && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            className="pr-2xl"
          >
            <Text className="font-inter-regular text-caption text-text-secondary leading-5">
              {item.description}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();

  // ── i18n ──
  const { t }       = useTranslation('onboarding');
  const { t: tc }   = useTranslation('common');

  // ── State ──
  const [values, setValues] = useState<Record<PermissionKey, boolean>>({
    battery: false,
    // notifications: false, // ← décommenter avec le handler
    contacts: false,
    calendar: false,
    location: false,
  });
  const [loadingKey, setLoadingKey] = useState<PermissionKey | null>(null);
  const [expandedKey, setExpandedKey] = useState<PermissionKey | null>(null);

  // ── Permissions avec textes traduits — recalculé à chaque changement de langue ──
  const permissions = useMemo<PermissionItem[]>(() =>
    PERMISSION_CONFIGS.map((config) => ({
      ...config,
      title:       t(`permissions.items.${config.key}.title`),
      subtitle:    t(`permissions.items.${config.key}.subtitle`),
      description: t(`permissions.items.${config.key}.description`),
      badge: config.hasBadge
        ? { label: tc('badges.essential'), variant: config.badgeVariant ?? 'accent' }
        : undefined,
    }))
  , [t, tc]);

  // ── Label "whyNeeded" partagé — calculé une seule fois par render ──
  const whyNeededLabel = t('permissions.whyNeeded');

  // ── Vérification des permissions au montage ──
  useEffect(() => {
    (async () => {
      const keys = Object.keys(PERMISSION_HANDLERS) as PermissionKey[];
      const results = await Promise.all(
        keys.map(async (key) => {
          try {
            const granted = await PERMISSION_HANDLERS[key].check();
            return [key, granted] as const;
          } catch {
            return [key, null] as const;
          }
        })
      );
      setValues((prev) => {
        const next = { ...prev };
        for (const [key, granted] of results) {
          if (granted === true) next[key] = true;
        }
        return next;
      });
    })();
  }, []);

  // ── Toggle permission ──
  const handleToggle = useCallback(async (key: PermissionKey) => {
    if (values[key]) {
      Alert.alert(
        t('permissions.alerts.disable.title'),
        t('permissions.alerts.disable.message'),
        [
          { text: tc('actions.cancel'), style: 'cancel' },
          { text: tc('actions.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    setLoadingKey(key);
    try {
      const { granted, canAskAgain } = await PERMISSION_HANDLERS[key].request();
      setValues((prev) => ({ ...prev, [key]: granted }));

      if (!granted && key !== 'battery') {
        if (!canAskAgain) {
          // Android a bloqué définitivement — uniquement les réglages peuvent débloquer
          Alert.alert(
            t('permissions.alerts.blocked.title'),
            t('permissions.alerts.blocked.message'),
            [
              { text: tc('actions.later'), style: 'cancel' },
              { text: tc('actions.openSettings'), onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          // Premier refus — Android peut encore présenter la modale
          Alert.alert(
            t('permissions.alerts.denied.title'),
            t('permissions.alerts.denied.message'),
            [
              { text: tc('actions.cancel'), style: 'cancel' },
              { text: tc('actions.openSettings'), onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } finally {
      setLoadingKey(null);
    }
  }, [values, t, tc]);

  const handleToggleExpand = useCallback((key: PermissionKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const handleContinue = () => {
    router.push('/(onboarding)/garant-setup' as any);
  };

  // ── Render ──
  return (
    <SafeScreenView>

       <View className="px-4">
        <View className="relative flex-row items-center justify-center mt-md pt-2">
          <View className="absolute left-0 z-50">
            <BackButton onPress={() => router.back()} />
          </View>
          <ProgressDots total={3} activeIndex={1} />
        </View>
    </View>
      <FlatList
        data={permissions}
        keyExtractor={(item) => item.key}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-md" />}
        ListHeaderComponent={
          <View className='pt-2xl'>
            <Text className="font-space-bold text-display-l text-text-primary mb-md mt-2">
              {t('permissions.title')}
            </Text>
            <Text className="font-inter-regular text-body-m text-text-secondary mb-3xl">
              {t('permissions.description')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PermissionCard
            item={item}
            value={values[item.key]}
            loading={loadingKey === item.key}
            expanded={expandedKey === item.key}
            whyNeededLabel={whyNeededLabel}
            onToggle={() => handleToggle(item.key)}
            onToggleExpand={() => handleToggleExpand(item.key)}
          />
        )}
        ListFooterComponent={
          <View className="flex-row items-center justify-center gap-sm mt-3xl">
            <ShieldCheck size={14} color="#4A6480" />
            <Text className="font-inter-regular text-caption text-text-muted">
              {tc('privacy.noDataShared')}
            </Text>
          </View>
        }
      />

      {/* Bouton fixe */}
      <View
        className="absolute bottom-0 left-0 right-0 px-xl pt-md bg-deep border-t border-border"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          label={tc('actions.continue')}
          variant="primary"
          size="l"
          fullWidth
          rightIcon={ArrowRight}
          onPress={handleContinue}
        />
      </View>
    </SafeScreenView>
  );
}