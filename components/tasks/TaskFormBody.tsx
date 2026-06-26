import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import dayjs, { type Dayjs } from 'dayjs';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { ChevronLeft, ChevronRight, Clock, MapPin, Crown, Lock, Users, Phone } from 'lucide-react-native';

import { Toggle } from '@/components/ui/Toggle';
import { useGarantsStore } from '@/stores/garants.store';
import { useAuthStore } from '@/stores/auth.store';
import { ICON_TYPE_ICON, ICON_TYPE_COLOR } from '@/utils/taskAction.utils';
import type { TaskIconType, TaskCategory, TaskPriority, TaskLocation, TaskAction } from '@/types/task.types';

const DEFAULT_RADIUS_METERS = 150;
const QUICK_DURATIONS_MIN = [15, 30, 60, 120] as const;

const ICON_TYPES: TaskIconType[] = ['call', 'message', 'document', 'payment', 'event', 'checklist', 'goal'];
const CATEGORIES: TaskCategory[] = ['work', 'personal', 'health'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#8BA3BE', medium: '#4D9EFF', high: '#FFB800', critical: '#FF3B5C',
};

// ─── RepeatButton — tap = un pas, appui long = avance en continu ───────────
// Pattern boutons de volume : un tap simple avance d'un pas ; un appui
// maintenu déclenche un rythme régulier jusqu'au relâchement.

const HOLD_REPEAT_DELAY_MS = 350;
const HOLD_REPEAT_INTERVAL_MS = 110;

function RepeatButton({
  onStep, disabled, children,
}: {
  onStep: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasLongPressRef = useRef(false);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function stopRepeat() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startRepeat() {
    wasLongPressRef.current = true;
    onStep();
    intervalRef.current = setInterval(onStep, HOLD_REPEAT_INTERVAL_MS);
  }

  return (
    <Pressable
      onPress={() => {
        if (wasLongPressRef.current) { wasLongPressRef.current = false; return; }
        onStep();
      }}
      onLongPress={startRepeat}
      delayLongPress={HOLD_REPEAT_DELAY_MS}
      onPressOut={stopRepeat}
      disabled={disabled}
      hitSlop={8}
      className="p-[4px]"
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      {children}
    </Pressable>
  );
}

function StepperField({
  label, value, onPrev, onNext, disablePrev,
}: {
  label: string; value: string; onPrev: () => void; onNext: () => void; disablePrev?: boolean;
}) {
  return (
    <View className="flex-1">
      <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[8px]">
        {label}
      </Text>
      <View
        className="flex-row items-center justify-between rounded-[14px] px-[10px]"
        style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
      >
        <RepeatButton onStep={onPrev} disabled={disablePrev}>
          <ChevronLeft size={18} color="#8BA3BE" strokeWidth={2} />
        </RepeatButton>
        <Text className="font-inter-semibold text-body-m text-text-primary">{value}</Text>
        <RepeatButton onStep={onNext}>
          <ChevronRight size={18} color="#8BA3BE" strokeWidth={2} />
        </RepeatButton>
      </View>
    </View>
  );
}

export type AlertMode = 'time' | 'location';

export interface TaskFormValue {
  alertMode:     AlertMode;
  iconType:      TaskIconType;
  date:          Dayjs;
  category:      TaskCategory;
  priority:      TaskPriority;
  garantEnabled: boolean;
  garantId:      string | undefined;
  location:      TaskLocation | undefined;
  action:        TaskAction | undefined;
}

interface Props {
  value:    TaskFormValue;
  onChange: (patch: Partial<TaskFormValue>) => void;
}

export function TaskFormBody({ value, onChange }: Props) {
  const { t }    = useTranslation('task');
  const { t: tF } = useTranslation('filters');
  const allGarants = useGarantsStore((s) => s.garants);
  const garants    = useMemo(() => allGarants.filter((g) => g.isActive), [allGarants]);
  const isPro     = useAuthStore((s) => s.user?.isPro ?? false);
  const [locating, setLocating] = useState(false);

  function handleSelectMode(mode: AlertMode) {
    // On laisse sélectionner "Lieu" même sans Pro — sinon l'utilisateur ne
    // voit jamais l'explication (ci-dessous) de pourquoi c'est verrouillé.
    // Seule la fonctionnalité réelle (position actuelle) reste bloquée.
    onChange({ alertMode: mode });
  }

  function handleCallNumberChange(text: string) {
    onChange({
      action: text.trim() ? { type: 'call', payload: text, label: t('call_now') } : undefined,
    });
  }

  // presentContactPickerAsync ouvre le sélecteur natif sans demander la
  // permission Contacts — seul le contact choisi est renvoyé, pas la liste
  // entière, donc plus respectueux de la vie privée que requestPermissions.
  async function handlePickContact() {
    try {
      const contact = await Contacts.presentContactPickerAsync();
      const phone = contact?.phoneNumbers?.[0]?.number;
      if (!phone) return;
      onChange({
        action: { type: 'call', payload: phone, label: t('create.callLabelWithName', { name: contact.name ?? '' }) },
      });
    } catch {}
  }

  // TODO [API]: le déclenchement réel (geofencing en arrière-plan quand
  // l'utilisateur entre/sort de la zone) est une brique backend/native à part —
  // ici on attache seulement la position au moment de la création.
  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = places[0];
      const label = place ? [place.street, place.city].filter(Boolean).join(', ') : t('create.locationUnknown');
      onChange({
        location: {
          label,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radiusMeters: DEFAULT_RADIUS_METERS,
        },
      });
    } finally {
      setLocating(false);
    }
  }

  const isToday = useMemo(() => value.date.isSame(dayjs(), 'day'), [value.date]);
  const dateLabel = useMemo(
    () => (isToday ? t('create.today') : value.date.format('ddd D MMM')),
    [value.date, isToday, t],
  );
  const timeLabel = useMemo(() => value.date.format('HH:mm'), [value.date]);

  // On ne peut pas reculer avant aujourd'hui — planifier une tâche dans le
  // passé n'a pas de sens (elle ne sonnerait jamais).
  function handleDatePrev() {
    if (isToday) return;
    onChange({ date: value.date.subtract(1, 'day') });
  }

  // Même logique pour l'heure quand la date est aujourd'hui : impossible de
  // choisir une heure déjà passée. Le seuil est recalculé à chaque appel
  // puisque "maintenant" avance en continu.
  const isTimeAtFloor = isToday && value.date.subtract(15, 'minute').isBefore(dayjs());
  function handleTimePrev() {
    const candidate = value.date.subtract(15, 'minute');
    if (candidate.isBefore(dayjs())) return;
    onChange({ date: candidate });
  }

  return (
    <>
      {/* ── Type d'action ───────────────────────────────────────────────── */}
      <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
        {t('create.iconType')}
      </Text>
      <View className="flex-row flex-wrap gap-[10px] mb-[20px]">
        {ICON_TYPES.map((it) => {
          const Icon = ICON_TYPE_ICON[it];
          const color = ICON_TYPE_COLOR[it];
          const active = value.iconType === it;
          return (
            <Pressable
              key={it}
              onPress={() => onChange({ iconType: it })}
              className="flex-row items-center gap-[7px] px-[12px] py-[10px] rounded-full border"
              style={{
                backgroundColor: active ? `${color}26` : '#0D1520',
                borderColor:     active ? color : '#1E3048',
                borderWidth:     active ? 1.5 : 1,
              }}
            >
              <Icon size={16} color={active ? color : '#4A6480'} strokeWidth={1.8} />
              <Text
                className="font-inter-semibold text-body-s"
                style={{ color: active ? color : '#8BA3BE' }}
              >
                {t(`iconTypes.${it}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Configuration de l'appel — uniquement si Type d'action = Appel ── */}
      {value.iconType === 'call' && (
        <View className="mb-[20px]">
          <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
            {t('create.callConfig')}
          </Text>
          <View
            className="flex-row items-center rounded-[14px] px-[16px] mb-[10px]"
            style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
          >
            <Phone size={16} color="#4A6480" strokeWidth={1.8} />
            <BottomSheetTextInput
              value={value.action?.payload ?? ''}
              onChangeText={handleCallNumberChange}
              placeholder={t('create.callNumberPlaceholder')}
              placeholderTextColor="#4A6480"
              keyboardType="phone-pad"
              style={{ flex: 1, marginLeft: 10, fontFamily: 'Inter-Regular', fontSize: 15, color: '#F0F6FF' }}
            />
          </View>
          <Pressable
            onPress={handlePickContact}
            className="flex-row items-center gap-[10px] rounded-[14px] px-[16px] border border-subtle"
            style={{ height: 48, backgroundColor: '#121E2E' }}
          >
            <Users size={16} color="#4D9EFF" strokeWidth={1.8} />
            <Text className="flex-1 font-inter-medium text-body-s text-text-secondary">
              {t('create.pickContact')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Mode d'alerte — heure précise OU lieu, mutuellement exclusifs ── */}
      <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
        {t('create.alertMode')}
      </Text>
      <View className="flex-row gap-[10px] mb-[16px]">
        <Pressable
          onPress={() => handleSelectMode('time')}
          className="flex-1 flex-row items-center justify-center gap-[8px] rounded-2xl py-[12px] border"
          style={{
            backgroundColor: value.alertMode === 'time' ? 'rgba(255,107,26,0.10)' : '#0D1520',
            borderColor:     value.alertMode === 'time' ? '#FF6B1A' : '#1E3048',
            borderWidth:     value.alertMode === 'time' ? 1.5 : 1,
          }}
        >
          <Clock size={16} color={value.alertMode === 'time' ? '#FF6B1A' : '#8BA3BE'} strokeWidth={1.8} />
          <Text
            className="font-inter-semibold text-body-s"
            style={{ color: value.alertMode === 'time' ? '#FF6B1A' : '#8BA3BE' }}
          >
            {t('create.alertModeTime')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSelectMode('location')}
          className="flex-1 flex-row items-center justify-center gap-[6px] rounded-2xl py-[12px] border"
          style={{
            backgroundColor: value.alertMode === 'location' ? 'rgba(255,107,26,0.10)' : '#0D1520',
            borderColor:     value.alertMode === 'location' ? '#FF6B1A' : '#1E3048',
            borderWidth:     value.alertMode === 'location' ? 1.5 : 1,
            opacity:         isPro ? 1 : 0.6,
          }}
        >
          <MapPin size={16} color={value.alertMode === 'location' ? '#FF6B1A' : '#8BA3BE'} strokeWidth={1.8} />
          <Text
            className="font-inter-semibold text-body-s"
            style={{ color: value.alertMode === 'location' ? '#FF6B1A' : '#8BA3BE' }}
          >
            {t('create.alertModeLocation')}
          </Text>
          {!isPro && <Lock size={11} color="#4A6480" strokeWidth={1.8} />}
        </Pressable>
      </View>

      {value.alertMode === 'time' ? (
        <View className="mb-[20px]">
          {/* ── Raccourcis ─────────────────────────────────────────────────── */}
          <View className="flex-row gap-[8px] mb-[12px]">
            {QUICK_DURATIONS_MIN.map((min) => (
              <Pressable
                key={min}
                onPress={() => onChange({ date: dayjs().add(min, 'minute') })}
                className="flex-1 items-center py-[10px] rounded-full border border-subtle"
                style={{ backgroundColor: '#0D1520' }}
              >
                <Text className="font-inter-semibold text-body-s text-text-secondary">
                  {min < 60 ? t('create.inMinutes', { count: min }) : t('create.inHours', { count: min / 60 })}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Date / Heure précises ────────────────────────────────────── */}
          <View className="flex-row gap-[12px]">
            <StepperField
              label={t('create.date')}
              value={dateLabel}
              onPrev={handleDatePrev}
              onNext={() => onChange({ date: value.date.add(1, 'day') })}
              disablePrev={isToday}
            />
            <StepperField
              label={t('create.time')}
              value={timeLabel}
              onPrev={handleTimePrev}
              onNext={() => onChange({ date: value.date.add(15, 'minute') })}
              disablePrev={isTimeAtFloor}
            />
          </View>
        </View>
      ) : isPro ? (
        <View className="mb-[20px]">
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={locating}
            className="flex-row items-center gap-[10px] rounded-[14px] px-[16px] border"
            style={{ height: 52, backgroundColor: '#0D1520', borderWidth: 1.5, borderColor: '#1E3048' }}
          >
            <MapPin size={16} color="#4D9EFF" strokeWidth={1.8} />
            <Text className="flex-1 font-inter-medium text-body-s text-text-secondary" numberOfLines={1}>
              {locating
                ? t('create.locating')
                : value.location?.label || t('create.useCurrentLocation')}
            </Text>
          </Pressable>
          <Text className="font-inter-regular text-body-s text-text-muted mt-[8px] px-[2px]">
            {t('create.locationSubtitle')}
          </Text>
        </View>
      ) : (
        <View
          className="flex-row items-center gap-[10px] rounded-2xl px-[14px] py-[12px] mb-[20px] border"
          style={{ backgroundColor: 'rgba(255,107,26,0.06)', borderColor: 'rgba(255,107,26,0.25)' }}
        >
          <Crown size={15} color="#FF6B1A" strokeWidth={1.8} />
          <Text className="flex-1 font-inter-regular text-body-s text-text-secondary">
            {t('create.locationProNote')}
          </Text>
        </View>
      )}

      {/* ── Catégorie ────────────────────────────────────────────────────── */}
      <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
        {t('create.category')}
      </Text>
      <View className="flex-row gap-[10px] mb-[20px]">
        {CATEGORIES.map((c) => {
          const active = value.category === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange({ category: c })}
              className="px-[16px] py-[10px] rounded-full border"
              style={{
                backgroundColor: active ? '#FF6B1A' : 'transparent',
                borderColor:     active ? '#FF6B1A' : '#2A4560',
              }}
            >
              <Text className="font-inter-semibold text-body-s" style={{ color: active ? '#FFFFFF' : '#8BA3BE' }}>
                {tF(c)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Priorité ─────────────────────────────────────────────────────── */}
      <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[10px] px-[2px]">
        {t('create.priority')}
      </Text>
      <View className="flex-row gap-[10px] mb-[24px]">
        {PRIORITIES.map((p) => {
          const active = value.priority === p;
          const color = PRIORITY_COLOR[p];
          return (
            <Pressable
              key={p}
              onPress={() => onChange({ priority: p })}
              className="flex-1 items-center py-[10px] rounded-full border"
              style={{
                backgroundColor: active ? `${color}26` : 'transparent',
                borderColor:     active ? color : '#2A4560',
              }}
            >
              <Text className="font-inter-semibold text-caption" style={{ color: active ? color : '#8BA3BE' }}>
                {t(`priorities.${p}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Garant ───────────────────────────────────────────────────────── */}
      <View
        className="rounded-2xl px-[16px] py-[14px] mb-[24px] border border-subtle"
        style={{ backgroundColor: '#0D1520' }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-[10px]">
            <Text className="font-inter-semibold text-body-m text-text-primary">
              {t('create.garantToggle')}
            </Text>
            <Text className="font-inter-regular text-body-s text-text-muted mt-[2px]">
              {t('create.garantSubtitle')}
            </Text>
          </View>
          <Toggle value={value.garantEnabled} onChange={(v) => onChange({ garantEnabled: v })} />
        </View>

        {value.garantEnabled && (
          <View className="flex-row flex-wrap gap-[8px] mt-[14px]">
            {garants.length === 0 ? (
              <Text className="font-inter-regular text-body-s text-text-muted">
                {t('create.noGarants')}
              </Text>
            ) : garants.map((g) => {
              const active = value.garantId === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => onChange({ garantId: g.id })}
                  className="px-[14px] py-[8px] rounded-full border"
                  style={{
                    backgroundColor: active ? 'rgba(255,107,26,0.10)' : '#121E2E',
                    borderColor:     active ? '#FF6B1A' : '#1E3048',
                  }}
                >
                  <Text className="font-inter-medium text-body-s" style={{ color: active ? '#FF6B1A' : '#8BA3BE' }}>
                    {g.firstName} {g.lastName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}
