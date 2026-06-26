import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Brain,
  BarChart2,
  Flame,
  Shield,
  Vibrate,
  BellRing,
  Music2,
  ListMusic,
  ChevronDown,
  Crown,
  Volume2,
  X,
  Plus,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Animation, Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Toggle } from '@/components/ui/Toggle';
import { useAuthStore } from '@/stores/auth.store';
import {
  useNotificationSettingsStore,
  PRESET_SOUND_IDS,
  DEFAULT_ALARM_SOUND,
  type AlarmSoundId,
  type PresetSoundId,
  type CustomSound,
} from '@/stores/notificationSettings.store';

// ─── Sons d'alarme bundlés ────────────────────────────────────────────────────
// 3 fichiers fournis avec l'app — à placer dans assets/sounds/ :
//   alarm-classic.mp3, alarm-soft.mp3, alarm-digital.mp3
// (royalty-free — voir le message de livraison pour les sources exactes)

interface AlarmSound {
  id: PresetSoundId;
  file: number;
}

const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'classic', file: require('@/assets/sounds/alarm-classic.mp3') },
  { id: 'soft',    file: require('@/assets/sounds/alarm-soft.mp3')    },
  { id: 'digital', file: require('@/assets/sounds/alarm-digital.mp3') },
];

function isPresetSoundId(id: string): id is PresetSoundId {
  return (PRESET_SOUND_IDS as readonly string[]).includes(id);
}

// ─── Sons ajoutés — picker de fichiers (iOS + Android) ──────────────────────
// expo-document-picker donne le vrai nom du fichier choisi (contrairement au
// RingtoneManager Android qui ne renvoie qu'une URI sans nom) — utilisable
// sur les deux plateformes. Une fois choisi, le son reste disponible dans la
// liste (et reste testable), au lieu d'être un emplacement unique qui
// s'écrase à chaque sélection.

async function pickCustomSound(): Promise<CustomSound | undefined> {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (result.canceled || !result.assets[0]) return undefined;

    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.name };
  } catch {
    return undefined;
  }
}

// ─── AlarmSoundPicker ─────────────────────────────────────────────────────────

function AlarmSoundPicker({
  selected,
  customSounds,
  onSelectPreset,
  onSelectCustom,
  onAddCustom,
  onRemoveCustom,
}: {
  selected:       AlarmSoundId;
  customSounds:   CustomSound[];
  onSelectPreset: (id: PresetSoundId) => void;
  onSelectCustom: (uri: string) => void;
  onAddCustom:    (sound: CustomSound) => void;
  onRemoveCustom: (uri: string) => void;
}) {
  const { t } = useTranslation('notifications');
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const height   = useSharedValue(0);

  // Un player par preset — il n'y en a que 3, fixes, donc pas de souci avec
  // les règles des hooks (toujours le même nombre d'appels, dans le même ordre).
  const players = {
    classic: useAudioPlayer(ALARM_SOUNDS[0].file),
    soft:    useAudioPlayer(ALARM_SOUNDS[1].file),
    digital: useAudioPlayer(ALARM_SOUNDS[2].file),
  } as const;

  const classicStatus = useAudioPlayerStatus(players.classic);
  const softStatus    = useAudioPlayerStatus(players.soft);
  const digitalStatus = useAudioPlayerStatus(players.digital);

  const statuses: Record<PresetSoundId, ReturnType<typeof useAudioPlayerStatus>> = {
    classic: classicStatus,
    soft:    softStatus,
    digital: digitalStatus,
  };

  const presetPlaying = PRESET_SOUND_IDS.find((id) => statuses[id].playing) ?? null;

  // Un seul player "dynamique" pour prévisualiser n'importe quel son ajouté —
  // sa source change selon ce qu'on veut écouter, pas besoin d'un hook par son.
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const customPlayer = useAudioPlayer(previewUri ? { uri: previewUri } : null);
  const customStatus = useAudioPlayerStatus(customPlayer);

  useEffect(() => {
    if (previewUri) customPlayer.play();
  }, [previewUri]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const listStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(height.value, [0, 1], [0, 60 + (ALARM_SOUNDS.length + customSounds.length + 1) * 60]),
    overflow:  'hidden' as const,
    opacity:   height.value,
  }));

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    rotation.value = withTiming(next ? 1 : 0, { duration: 200 });
    height.value   = withTiming(next ? 1 : 0, { duration: 250 });
  }

  function stopAllPreviews() {
    PRESET_SOUND_IDS.forEach((id) => {
      if (players[id].playing) {
        players[id].pause();
        players[id].seekTo(0);
      }
    });
    if (customStatus.playing) {
      customPlayer.pause();
      customPlayer.seekTo(0);
    }
  }

  function previewPreset(id: PresetSoundId) {
    if (customStatus.playing) {
      customPlayer.pause();
      customPlayer.seekTo(0);
    }
    PRESET_SOUND_IDS.forEach((key) => {
      if (key !== id && players[key].playing) {
        players[key].pause();
        players[key].seekTo(0);
      }
    });

    const player = players[id];
    if (player.playing) {
      player.pause();
      player.seekTo(0);
    } else {
      player.seekTo(0);
      player.play();
    }
  }

  function previewCustom(uri: string) {
    if (previewUri === uri && customStatus.playing) {
      customPlayer.pause();
      customPlayer.seekTo(0);
      return;
    }
    PRESET_SOUND_IDS.forEach((key) => {
      if (players[key].playing) {
        players[key].pause();
        players[key].seekTo(0);
      }
    });
    setPreviewUri(uri);
  }

  async function handleAddCustom() {
    stopAllPreviews();
    const picked = await pickCustomSound();
    if (!picked) return; // annulé
    onAddCustom(picked);
    Haptics.selectionAsync().catch(() => {});
  }

  const headerSubtitle = isPresetSoundId(selected)
    ? t(`sections.reminders.sound.options.${selected}`)
    : customSounds.find((s) => s.uri === selected)?.name ?? t('sections.reminders.sound.label');

  return (
    <View>
      {/* Header — toujours visible, ouvre/ferme le picker */}
      <Pressable
        onPress={toggle}
        className="flex-row items-center px-[16px] py-[16px] min-h-[60px]"
      >
        <View className="flex-1 mr-[10px]">
          <Text className="font-inter-semibold text-body-m text-text-primary">
            {t('sections.reminders.sound.label')}
          </Text>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
            {headerSubtitle}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color="#4A6480" strokeWidth={1.8} />
        </Animated.View>
      </Pressable>

      {/* Liste déroulante — presets + sons ajoutés + bouton "Ajouter" */}
      <Animated.View style={listStyle}>
        <View className="mx-[16px] mb-[12px] rounded-[14px] overflow-hidden border border-subtle">

          {/* Presets */}
          {ALARM_SOUNDS.map((sound, i) => {
            const isSelected = selected === sound.id;
            const isPlaying  = presetPlaying === sound.id;

            return (
              <View key={sound.id}>
                {i > 0 && <View className="h-px bg-subtle" />}
                <Pressable
                  onPress={() => {
                    onSelectPreset(sound.id);
                    previewPreset(sound.id);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  className="flex-row items-center px-[14px] py-[13px]"
                  style={{ backgroundColor: isSelected ? 'rgba(255,107,26,0.08)' : '#0D1520' }}
                >
                  <View
                    className="w-[32px] h-[32px] rounded-[10px] items-center justify-center mr-[12px]"
                    style={{ backgroundColor: isSelected ? 'rgba(255,107,26,0.15)' : '#172436' }}
                  >
                    {isPlaying
                      ? <Volume2 size={15} color="#FF6B1A" strokeWidth={2} />
                      : <Music2  size={15} color={isSelected ? '#FF6B1A' : '#4A6480'} strokeWidth={1.8} />
                    }
                  </View>

                  <Text
                    className="flex-1 font-inter-medium text-body-m"
                    style={{ color: isSelected ? '#FF6B1A' : '#F0F6FF', includeFontPadding: false }}
                  >
                    {t(`sections.reminders.sound.options.${sound.id}`)}
                  </Text>

                  {isSelected && (
                    <View
                      className="w-[20px] h-[20px] rounded-full items-center justify-center"
                      style={{ backgroundColor: '#FF6B1A' }}
                    >
                      <Text className="text-white font-inter-bold" style={{ fontSize: 11 }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}

          {/* Sons ajoutés — persistés, testables à tout moment */}
          {customSounds.map((sound, i) => {
            const isSelected = selected === sound.uri;
            const isPlaying  = previewUri === sound.uri && customStatus.playing;

            return (
              <View key={sound.uri}>
                <View className="h-px bg-subtle" />
                <View
                  className="flex-row items-center px-[14px] py-[13px]"
                  style={{ backgroundColor: isSelected ? 'rgba(255,107,26,0.08)' : '#0D1520' }}
                >
                  <Pressable
                    onPress={() => {
                      onSelectCustom(sound.uri);
                      previewCustom(sound.uri);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    className="flex-1 flex-row items-center"
                  >
                    <View
                      className="w-[32px] h-[32px] rounded-[10px] items-center justify-center mr-[12px]"
                      style={{ backgroundColor: isSelected ? 'rgba(255,107,26,0.15)' : '#172436' }}
                    >
                      {isPlaying
                        ? <Volume2 size={15} color="#FF6B1A" strokeWidth={2} />
                        : <ListMusic size={15} color={isSelected ? '#FF6B1A' : '#4A6480'} strokeWidth={1.8} />
                      }
                    </View>

                    <Text
                      className="flex-1 font-inter-medium text-body-m"
                      style={{ color: isSelected ? '#FF6B1A' : '#F0F6FF', includeFontPadding: false }}
                      numberOfLines={1}
                    >
                      {sound.name}
                    </Text>

                    {isSelected && (
                      <View
                        className="w-[20px] h-[20px] rounded-full items-center justify-center mr-[10px]"
                        style={{ backgroundColor: '#FF6B1A' }}
                      >
                        <Text className="text-white font-inter-bold" style={{ fontSize: 11 }}>✓</Text>
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => onRemoveCustom(sound.uri)}
                    hitSlop={8}
                    className="w-[28px] h-[28px] items-center justify-center"
                  >
                    <X size={15} color="#4A6480" strokeWidth={1.8} />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* Ajouter un son — picker de fichiers, iOS + Android */}
          <View className="h-px bg-subtle" />
          <Pressable
            onPress={handleAddCustom}
            className="flex-row items-center px-[14px] py-[13px]"
          >
            <View
              className="w-[32px] h-[32px] rounded-[10px] items-center justify-center mr-[12px]"
              style={{ backgroundColor: '#172436' }}
            >
              <Plus size={15} color="#4A6480" strokeWidth={1.8} />
            </View>

            <Text
              className="flex-1 font-inter-medium text-body-m text-text-secondary"
              style={{ includeFontPadding: false }}
            >
              {t('sections.reminders.sound.add')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── ProLock — badge affiché sur les items réservés Pro ───────────────────────

function ProLock() {
  const { t } = useTranslation('notifications');
  return (
    <View
      className="flex-row items-center gap-[4px] px-[8px] py-[3px] rounded-full"
      style={{ backgroundColor: 'rgba(255,107,26,0.15)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.3)' }}
    >
      <Crown size={10} color="#FF6B1A" strokeWidth={2} />
      <Text
        className="font-inter-bold text-caption text-accent"
        style={{ includeFontPadding: false }}
      >
        Pro
      </Text>
    </View>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[14px] px-[4px]">
      {label}
    </Text>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label:     string;
  sublabel?: string;
  value:     boolean;
  onChange:  (v: boolean) => void;
  isPro?:    boolean;
  locked?:   boolean;
  icon?:     LucideIcon;
  iconBg?:   string;
  iconColor?: string;
  badge?:    React.ReactNode;
}

function ToggleRow({
  label, sublabel, value, onChange,
  isPro, locked, icon: Icon, iconBg, iconColor, badge,
}: ToggleRowProps) {
  return (
    <View className="flex-row items-center px-[16px] py-[16px] min-h-[60px]">
      {Icon && iconBg && iconColor && (
        <View
          className="w-[36px] h-[36px] rounded-[11px] items-center justify-center mr-[12px] flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={17} color={iconColor} strokeWidth={1.8} />
        </View>
      )}

      <View className="flex-1 mr-[10px]">
        <View className="flex-row items-center gap-[8px] flex-wrap">
          <Text className="font-inter-semibold text-body-m text-text-primary">
            {label}
          </Text>
          {badge}
          {locked && <ProLock />}
        </View>
        {sublabel && (
          <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
            {sublabel}
          </Text>
        )}
      </View>

      <View style={{ opacity: locked ? 0.35 : 1 }}>
        <Toggle
          value={locked ? false : value}
          onChange={locked ? () => {} : onChange}
          disabled={locked}
        />
      </View>
    </View>
  );
}

// ─── VibrationSlider ──────────────────────────────────────────────────────────

const INTENSITY_STEPS = [0.25, 0.5, 0.75, 1.0];

const HAPTIC_FOR_STEP: Haptics.ImpactFeedbackStyle[] = [
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Light,
  Haptics.ImpactFeedbackStyle.Medium,
  Haptics.ImpactFeedbackStyle.Heavy,
];

function VibrationSlider({
  value,
  onChange,
  locked,
  labelMin,
  labelMax,
}: {
  value:    number;
  onChange: (v: number) => void;
  locked:   boolean;
  labelMin: string;
  labelMax: string;
}) {
  const foundIndex = INTENSITY_STEPS.findIndex((s) => s >= value);
  const stepIndex   = foundIndex === -1 ? INTENSITY_STEPS.length - 1 : foundIndex;

  function handleSelect(step: number, index: number) {
    if (locked) return;
    onChange(step);
    Haptics.impactAsync(HAPTIC_FOR_STEP[index]).catch(() => {});
  }

  return (
    <View className="px-[16px] pb-[16px]" style={{ opacity: locked ? 0.35 : 1 }}>
      <View className="flex-row items-center gap-[6px]">
        {INTENSITY_STEPS.map((step, i) => {
          const filled = i <= stepIndex;
          return (
            <Pressable
              key={i}
              onPress={() => handleSelect(step, i)}
              className="flex-1 rounded-full"
              style={{ height: 5, backgroundColor: filled ? '#FF6B1A' : '#1E3048' }}
            />
          );
        })}
      </View>

      <View className="flex-row justify-between mt-[10px]">
        <Text className="font-inter-regular text-caption text-text-muted uppercase">{labelMin}</Text>
        <Text className="font-inter-regular text-caption text-text-muted uppercase">{labelMax}</Text>
      </View>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <View className="h-px bg-subtle mx-[16px]" />;
}

// ─── TestAlarmButton ──────────────────────────────────────────────────────────

function TestAlarmButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale  = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[aStyle, { alignItems: 'center' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.95, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        className="flex-row items-center gap-[10px] px-[24px] py-[14px]"
      >
        <BellRing size={18} color="#FF6B1A" strokeWidth={1.8} />
        <Text
          className="font-inter-semibold text-body-m text-accent"
          style={{ includeFontPadding: false }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── NotificationsScreen ──────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { t }  = useTranslation('notifications');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPro  = useAuthStore(s => s.user?.isPro ?? false);

  // Tout vient du store persisté — plus de useState local, plus de reset au
  // redémarrage de l'app.
  const settings = useNotificationSettingsStore();
  const set      = useNotificationSettingsStore((s) => s.set);

  const ImmediatBadge = (
    <View
      className="px-[7px] py-[2px] rounded-full"
      style={{ backgroundColor: '#FF3B5C' }}
    >
      <Text
        className="font-inter-bold text-caption text-white uppercase"
        style={{ includeFontPadding: false }}
      >
        {t('badges.immediate')}
      </Text>
    </View>
  );

  return (
    <SafeScreenView withGradient>
      <ScreenHeader
        title={t('header.title')}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48 }}
      >

        {/* ── RAPPELS ──────────────────────────────────────────────────── */}
        <View className="mb-[32px]">
          <SectionTitle label={t('sections.reminders.title')} />
          <View className="bg-card rounded-2xl overflow-hidden border border-subtle" style={Shadows.card}>

            <ToggleRow
              label={t('sections.reminders.multiple.label')}
              sublabel={
                isPro
                  ? t('sections.reminders.multiple.sublabelPro')
                  : t('sections.reminders.multiple.sublabelLocked')
              }
              value={settings.multipleReminders}
              onChange={(v) => set('multipleReminders', v)}
              locked={!isPro}
            />

            <Divider />

            <ToggleRow
              label={t('sections.reminders.silence.label')}
              sublabel={t('sections.reminders.silence.sublabel')}
              value={settings.silenceEnabled}
              onChange={(v) => set('silenceEnabled', v)}
            />

            <Divider />

            <AlarmSoundPicker
              selected={settings.alarmSoundId}
              customSounds={settings.customSounds}
              onSelectPreset={(id) => set('alarmSoundId', id)}
              onSelectCustom={(uri) => set('alarmSoundId', uri)}
              onAddCustom={(sound) => {
                if (!settings.customSounds.some((s) => s.uri === sound.uri)) {
                  set('customSounds', [...settings.customSounds, sound]);
                }
                set('alarmSoundId', sound.uri);
              }}
              onRemoveCustom={(uri) => {
                set('customSounds', settings.customSounds.filter((s) => s.uri !== uri));
                if (settings.alarmSoundId === uri) {
                  set('alarmSoundId', DEFAULT_ALARM_SOUND);
                }
              }}
            />
          </View>
        </View>

        {/* ── NOTIFICATIONS SYSTÈME ─────────────────────────────────────── */}
        <View className="mb-[32px]">
          <SectionTitle label={t('sections.system.title')} />
          <View className="bg-card rounded-2xl overflow-hidden border border-subtle" style={Shadows.card}>

            <ToggleRow
              label={t('sections.system.lateTasks.label')}
              value={settings.lateTasks}
              onChange={(v) => set('lateTasks', v)}
              icon={AlertCircle}
              iconBg="rgba(255,59,92,0.15)"
              iconColor="#FF3B5C"
            />
            <Divider />

            <ToggleRow
              label={t('sections.system.aiTips.label')}
              value={settings.aiTips}
              onChange={(v) => set('aiTips', v)}
              icon={Brain}
              iconBg="rgba(255,184,0,0.15)"
              iconColor="#FFB800"
              locked={!isPro}
            />
            <Divider />

            <ToggleRow
              label={t('sections.system.weeklyReport.label')}
              sublabel={t('sections.system.weeklyReport.sublabel')}
              value={settings.weeklyReport}
              onChange={(v) => set('weeklyReport', v)}
              icon={BarChart2}
              iconBg="rgba(77,158,255,0.15)"
              iconColor="#4D9EFF"
            />
            <Divider />

            <ToggleRow
              label={t('sections.system.streaks.label')}
              sublabel={t('sections.system.streaks.sublabel')}
              value={settings.streaks}
              onChange={(v) => set('streaks', v)}
              icon={Flame}
              iconBg="rgba(255,107,26,0.15)"
              iconColor="#FF6B1A"
            />
            <Divider />

            <ToggleRow
              label={t('sections.system.garant.label')}
              value={settings.garantAlertImmediate}
              onChange={(v) => set('garantAlertImmediate', v)}
              icon={Shield}
              iconBg="rgba(255,59,92,0.15)"
              iconColor="#FF3B5C"
              badge={ImmediatBadge}
            />
          </View>
        </View>

        {/* ── AVANCÉ ────────────────────────────────────────────────────── */}
        <View className="mb-[32px]">
          <SectionTitle label={t('sections.advanced.title')} />
          <View className="bg-card rounded-2xl overflow-hidden border border-subtle" style={Shadows.card}>

            <ToggleRow
              label={t('sections.advanced.vibration.label')}
              value={settings.vibrationEnabled}
              onChange={(v) => set('vibrationEnabled', v)}
              icon={Vibrate}
              iconBg="rgba(77,158,255,0.15)"
              iconColor="#4D9EFF"
            />

            {settings.vibrationEnabled && (
              <VibrationSlider
                value={settings.vibrationIntensity}
                onChange={(v) => set('vibrationIntensity', v)}
                locked={!isPro}
                labelMin={t('sections.advanced.vibration.min')}
                labelMax={t('sections.advanced.vibration.max')}
              />
            )}

            <Divider />

            <ToggleRow
              label={t('sections.advanced.persistent.label')}
              sublabel={
                isPro
                  ? t('sections.advanced.persistent.sublabelPro')
                  : t('sections.advanced.persistent.sublabelLocked')
              }
              value={settings.persistentAlarm}
              onChange={(v) => set('persistentAlarm', v)}
              locked={!isPro}
            />
            <Divider />

            <ToggleRow
              label={t('sections.advanced.lockScreen.label')}
              sublabel={
                isPro
                  ? t('sections.advanced.lockScreen.sublabelPro')
                  : t('sections.advanced.lockScreen.sublabelLocked')
              }
              value={settings.lockScreenOverride}
              onChange={(v) => set('lockScreenOverride', v)}
              locked={!isPro}
            />
            <Divider />

            <ToggleRow
              label={t('sections.advanced.directAction.label')}
              sublabel={t('sections.advanced.directAction.sublabel')}
              value={settings.directAction}
              onChange={(v) => set('directAction', v)}
            />
          </View>
        </View>

        {/* ── TESTER UNE ALARME ─────────────────────────────────────────── */}
        <View className="items-center mt-[8px]">
          <TestAlarmButton
            label={t('testAlarm')}
            onPress={() => {
              // TODO [notifications]: déclencher expo-notifications avec settings.alarmSoundId
            }}
          />
        </View>

      </ScrollView>
    </SafeScreenView>
  );
}