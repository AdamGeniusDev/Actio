import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Mic, Send, Lock, Crown, Pencil } from 'lucide-react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { File } from 'expo-file-system';

import { Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTasksStore } from '@/stores/tasks.store';
import { ICON_TYPE_ICON, ICON_TYPE_COLOR } from '@/utils/taskAction.utils';
import { dateUtils } from '@/utils/date.utils';
import type { DetectedTask } from '@/lib/aiTaskParser';
import { useParseTaskFromAudioMutation, useParseTaskFromTextMutation } from '@/hooks/api/useAi';
import { ApiError } from '@/lib/api/client';

const SUGGESTIONS = ['suggestion1', 'suggestion2', 'suggestion3'] as const;

// Sortie de RecordingPresets.HIGH_QUALITY — doit matcher un format accepté côté backend.
const RECORDING_FORMAT = 'm4a';

// ─── ProGate ───────────────────────────────────────────────────────────────────

function ProGate() {
  const { t } = useTranslation('task');
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-[32px]">
      <View
        className="w-[64px] h-[64px] rounded-full items-center justify-center mb-[20px]"
        style={{ backgroundColor: 'rgba(255,107,26,0.12)' }}
      >
        <Lock size={26} color="#FF6B1A" strokeWidth={1.8} />
      </View>
      <Text className="font-clash-bold text-display-s text-text-primary text-center mb-[10px]">
        {t('ai.proGate.title')}
      </Text>
      <Text className="font-inter-regular text-body-m text-text-secondary text-center leading-[22px] mb-[28px]">
        {t('ai.proGate.subtitle')}
      </Text>
      <Button
        label={t('ai.proGate.cta')}
        variant="primary"
        size="l"
        fullWidth
        leftIcon={Crown}
        onPress={() => router.push('/(pro)/features' as any)}
      />
    </View>
  );
}

// ─── CreateAIScreen ───────────────────────────────────────────────────────────

export default function CreateAIScreen() {
  const { t }    = useTranslation('task');
  const { t: tF } = useTranslation('filters');
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const isPro    = useAuthStore((s) => s.user?.isPro ?? false);
  const addTask  = useTasksStore((s) => s.addTask);
  const openTaskSheet = useUIStore((s) => s.openTaskSheet);
  const addToast = useUIStore((s) => s.addToast);

  const [input, setInput]   = useState('');
  const [recording, setRecording] = useState(false);
  const [detected, setDetected]   = useState<DetectedTask | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const parseTextMutation  = useParseTaskFromTextMutation();
  const parseAudioMutation = useParseTaskFromAudioMutation();

  const micScale = useSharedValue(1);

  function handleApiError(error: unknown) {
    const message = error instanceof ApiError ? error.message : t('ai.errors.generic');
    addToast({ message, type: 'error' });
  }

  async function startRecording() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        addToast({ message: t('ai.errors.micPermission'), type: 'error' });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();

      setRecording(true);
      micScale.value = withRepeat(withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    } catch {
      addToast({ message: t('ai.errors.recordingFailed'), type: 'error' });
    }
  }

  async function stopRecording() {
    micScale.value = withTiming(1, { duration: 200 });
    setRecording(false);

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        addToast({ message: t('ai.errors.recordingFailed'), type: 'error' });
        return;
      }

      const audioBase64 = await new File(uri).base64();
      setInput('');
      const result = await parseAudioMutation.mutateAsync({ audioBase64, format: RECORDING_FORMAT });
      setDetected(result);
    } catch (error) {
      handleApiError(error);
    }
  }

  function handleMicPress() {
    if (parseAudioMutation.isPending) return;
    if (recording) stopRecording();
    else startRecording();
  }

  async function handleSend() {
    if (!input.trim() || parseTextMutation.isPending) return;
    try {
      const result = await parseTextMutation.mutateAsync(input.trim());
      setDetected(result);
    } catch (error) {
      handleApiError(error);
    }
  }

  async function handleSuggestion(key: string) {
    const text = t(`ai.suggestions.${key}`);
    setInput(text);
    if (parseTextMutation.isPending) return;
    try {
      const result = await parseTextMutation.mutateAsync(text);
      setDetected(result);
    } catch (error) {
      handleApiError(error);
    }
  }

  function handleCreate() {
    if (!detected) return;
    addTask(detected);
    setInput('');
    setDetected(null);
    router.back();
  }

  function handleModify() {
    if (!detected) return;
    openTaskSheet(detected);
    router.back();
  }

  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  const isParsing = parseTextMutation.isPending || parseAudioMutation.isPending;

  if (!isPro) {
    return (
      <SafeScreenView withGradient>
        <View className="flex-row items-center gap-[10px] px-[20px] py-[16px]">
          <Sparkles size={18} color="#FF6B1A" />
          <Text className="font-clash-bold text-display-s text-text-primary">
            {t('ai.header.title')}
          </Text>
        </View>
        <ProGate />
      </SafeScreenView>
    );
  }

  const DetectedIcon = detected ? ICON_TYPE_ICON[detected.iconType] : Sparkles;
  const detectedColor = detected ? ICON_TYPE_COLOR[detected.iconType] : '#FF6B1A';

  return (
    <SafeScreenView withGradient>
      <View className="flex-row items-center gap-[10px] px-[20px] py-[16px]">
        <Sparkles size={18} color="#FF6B1A" />
        <Text className="font-clash-bold text-display-s text-text-primary">
          {t('ai.header.title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Bulle de bienvenue ───────────────────────────────────────────── */}
        <View className="flex-row items-start gap-[10px] mb-[28px]">
          <View
            className="w-[32px] h-[32px] rounded-full items-center justify-center"
            style={{ backgroundColor: '#FF6B1A' }}
          >
            <Sparkles size={15} color="#fff" />
          </View>
          <View className="flex-1 bg-card rounded-2xl rounded-tl-[4px] px-[16px] py-[12px] border border-subtle">
            <Text className="font-inter-regular text-body-m text-text-secondary leading-[21px]">
              {t('ai.greeting')}
            </Text>
          </View>
        </View>

        {/* ── Micro ────────────────────────────────────────────────────────── */}
        <View className="items-center mb-[24px]">
          <Pressable onPress={handleMicPress} disabled={parseAudioMutation.isPending}>
            <Animated.View style={micStyle}>
              <View
                className="w-[88px] h-[88px] rounded-full items-center justify-center"
                style={[{ backgroundColor: recording ? '#FF3D00' : '#FF6B1A' }, Shadows.accent]}
              >
                <Mic size={34} color="#fff" strokeWidth={1.8} />
              </View>
            </Animated.View>
          </Pressable>
          <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mt-[12px]">
            {recording
              ? t('ai.listening')
              : parseAudioMutation.isPending
                ? t('ai.analyzing')
                : t('ai.tapToSpeak')}
          </Text>
        </View>

        {/* ── Saisie texte ─────────────────────────────────────────────────── */}
        <View
          className="flex-row items-center rounded-[14px] px-[16px] mb-[20px]"
          style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('ai.textPlaceholder')}
            placeholderTextColor="#4A6480"
            onSubmitEditing={handleSend}
            editable={!isParsing}
            style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
          />
          <Pressable onPress={handleSend} hitSlop={8} disabled={isParsing}>
            <Send size={18} color={isParsing ? '#4A6480' : '#FF6B1A'} strokeWidth={2} />
          </Pressable>
        </View>

        {/* ── Suggestions ──────────────────────────────────────────────────── */}
        <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
          {t('ai.suggestionsLabel')}
        </Text>
        <View className="gap-[8px] mb-[28px]">
          {SUGGESTIONS.map((key) => (
            <Pressable
              key={key}
              onPress={() => handleSuggestion(key)}
              disabled={isParsing}
              className="self-start px-[14px] py-[10px] rounded-full border border-subtle"
              style={{ backgroundColor: '#121E2E' }}
            >
              <Text className="font-inter-medium text-body-s text-text-secondary">
                {t(`ai.suggestions.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Résultat détecté ─────────────────────────────────────────────── */}
        {detected && (
          <View>
            <Text className="font-inter-semibold text-label text-accent uppercase tracking-widest mb-[10px] px-[2px]">
              {t('ai.detectedLabel')}
            </Text>
            <View
              className="rounded-2xl px-[16px] py-[16px] border"
              style={{ backgroundColor: 'rgba(255,107,26,0.06)', borderColor: '#FF6B1A' }}
            >
              <View className="flex-row items-center justify-between mb-[12px]">
                <Text className="flex-1 font-inter-semibold text-body-m text-text-primary mr-[10px]" numberOfLines={2}>
                  {detected.title}
                </Text>
                <Pencil size={15} color="#8BA3BE" strokeWidth={1.8} />
              </View>

              <View className="flex-row flex-wrap gap-[8px] mb-[14px]">
                <Badge label={t(`iconTypes.${detected.iconType}`)} variant="ghost" />
                <Badge label={tF(detected.category)} variant="info" />
                <Badge label={dateUtils.formatTime(detected.scheduledAt)} variant="warning" />
              </View>

              <View className="flex-row gap-[10px] mb-[10px]">
                <View className="flex-1">
                  <Button label={t('ai.createCta')} variant="primary" fullWidth onPress={handleCreate} />
                </View>
                <View className="flex-1">
                  <Button label={t('ai.modifyCta')} variant="secondary" fullWidth onPress={handleModify} />
                </View>
              </View>

              <Badge label={t(`priorities.${detected.priority}`)} variant="danger" />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeScreenView>
  );
}
