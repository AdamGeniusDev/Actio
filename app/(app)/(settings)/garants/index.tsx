import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Info, UserRound } from 'lucide-react-native';

import { Shadows } from '@/constants/theme';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useGarantsStore, type Garant, type Relationship } from '@/stores/garants.store';
import { GarantActionsSheet, type GarantActionsSheetHandle } from '@/components/garants/GarantActionsSheet';

// ─── RelationshipBadge ───────────────────────────────────────────────────────

const RELATIONSHIP_COLORS: Record<Relationship, { bg: string; text: string }> = {
  family:    { bg: 'rgba(46,204,113,0.15)',  text: '#2ECC71' },
  friend:    { bg: 'rgba(77,158,255,0.15)',  text: '#4D9EFF' },
  colleague: { bg: 'rgba(255,184,0,0.15)',   text: '#FFB800' },
  other:     { bg: 'rgba(150,160,180,0.15)', text: '#9AA8BC' },
};

function RelationshipBadge({ relationship }: { relationship: Relationship }) {
  const { t } = useTranslation('garants');
  const colors = RELATIONSHIP_COLORS[relationship];

  return (
    <View
      className="px-[8px] py-[3px] rounded-full"
      style={{ backgroundColor: colors.bg }}
    >
      <Text
        className="font-inter-bold text-caption uppercase"
        style={{ color: colors.text, includeFontPadding: false }}
      >
        {t(`relationships.${relationship}`)}
      </Text>
    </View>
  );
}

// ─── GarantAvatar ─────────────────────────────────────────────────────────

function GarantAvatar({ photoUrl, isActive }: { photoUrl?: string; isActive: boolean }) {
  return (
    <View className="relative mr-[14px]">
      <View
        className="w-[48px] h-[48px] rounded-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#172436' }}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="w-[48px] h-[48px]" />
        ) : (
          <UserRound size={20} color="#4A6480" strokeWidth={1.8} />
        )}
      </View>

      {isActive && (
        <View
          className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full border-2"
          style={{ backgroundColor: '#2ECC71', borderColor: '#0D1520' }}
        />
      )}
    </View>
  );
}

// ─── GarantCard (actif) ───────────────────────────────────────────────────

function GarantCard({ garant, onPress }: { garant: Garant; onPress: () => void }) {
  const { t } = useTranslation('garants');
  const fullName = `${garant.firstName} ${garant.lastName}`.trim();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card rounded-2xl px-[16px] py-[14px] mb-[12px] border-l-[3px]"
      style={[Shadows.card, { borderLeftColor: '#2ECC71' }]}
    >
      <GarantAvatar photoUrl={garant.photoUrl} isActive={garant.isActive} />

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-[2px]">
          <Text
            className="font-inter-semibold text-body-m text-text-primary flex-shrink mr-[8px]"
            numberOfLines={1}
          >
            {fullName}
          </Text>
          <RelationshipBadge relationship={garant.relationship} />
        </View>
        <Text className="font-inter-regular text-body-s text-text-muted">
          {t('card.alertedAfter', { minutes: garant.alertDelayMinutes })}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── InactiveGarantCard ─────────────────────────────────────────────────────

function InactiveGarantCard({ garant, onPress }: { garant: Garant; onPress: () => void }) {
  const { t } = useTranslation('garants');
  const fullName = `${garant.firstName} ${garant.lastName}`.trim();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card rounded-2xl px-[16px] py-[14px] mb-[12px]"
      style={{ opacity: 0.45 }}
    >
      <View
        className="w-[48px] h-[48px] rounded-full items-center justify-center mr-[14px]"
        style={{ backgroundColor: '#172436' }}
      >
        <UserRound size={20} color="#4A6480" strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-body-m text-text-secondary">
          {fullName}
        </Text>
        <Text className="font-inter-regular text-body-s text-text-muted">
          {t('card.noActiveTask')}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── InfoBox ───────────────────────────────────────────────────────────────

function InfoBox() {
  const { t } = useTranslation('garants');

  return (
    <View
      className="rounded-2xl px-[16px] py-[16px] border"
      style={{ backgroundColor: 'rgba(77,158,255,0.08)', borderColor: 'rgba(77,158,255,0.25)' }}
    >
      <View className="flex-row items-center gap-[8px] mb-[8px]">
        <Info size={16} color="#4D9EFF" strokeWidth={1.8} />
        <Text className="font-inter-semibold text-body-m" style={{ color: '#4D9EFF' }}>
          {t('infoBox.title')}
        </Text>
      </View>
      <Text className="font-inter-regular text-body-s text-text-secondary leading-[20px]">
        {t('infoBox.description')}
      </Text>
    </View>
  );
}

// ─── AddGarantButton — élément droit du ScreenHeader ───────────────────────

function AddGarantButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-[6px] px-[14px] py-[8px] rounded-full"
      style={{ backgroundColor: '#FF6B1A' }}
    >
      <Plus size={15} color="#FFFFFF" strokeWidth={2.2} />
      <Text className="font-inter-bold text-body-s text-white">
        {label}
      </Text>
    </Pressable>
  );
}

// ─── GarantsScreen ───────────────────────────────────────────────────────────

export default function GarantsScreen() {
  const { t }   = useTranslation('garants');
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const garants = useGarantsStore((s) => s.garants);
  const sheetRef = useRef<GarantActionsSheetHandle>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return garants;
    return garants.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q)
    );
  }, [garants, search]);

  const active   = filtered.filter((g) => g.isActive);
  const inactive = filtered.filter((g) => !g.isActive);

  function openActions(garant: Garant) {
    sheetRef.current?.present(garant);
  }

  return (
    <SafeScreenView withGradient>
      <ScreenHeader
        title={t('header.title')}
        showBack
        rightSlot={
          <AddGarantButton
            onPress={() => router.push('/garants/new')}
            label={t('header.add')}
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 48 }}
      >
        {/* ── Recherche ───────────────────────────────────────────────────── */}
        <View className="flex-row items-center bg-card rounded-2xl px-[14px] py-[12px] mb-[28px] border border-subtle">
          <Search size={17} color="#4A6480" strokeWidth={1.8} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#4A6480"
            className="flex-1 font-inter-regular text-body-m text-text-primary ml-[10px]"
          />
        </View>

        {/* ── Actifs ──────────────────────────────────────────────────────── */}
        {active.length > 0 && (
          <View className="mb-[28px]">
            <View className="flex-row items-center gap-[6px] mb-[14px] px-[4px]">
              <View className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#2ECC71' }} />
              <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest">
                {t('sections.active')}
              </Text>
            </View>
            {active.map((g) => (
              <GarantCard key={g.id} garant={g} onPress={() => openActions(g)} />
            ))}
          </View>
        )}

        {/* ── Inactifs ────────────────────────────────────────────────────── */}
        {inactive.length > 0 && (
          <View className="mb-[28px]">
            <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest mb-[14px] px-[4px]">
              {t('sections.inactive')}
            </Text>
            {inactive.map((g) => (
              <InactiveGarantCard key={g.id} garant={g} onPress={() => openActions(g)} />
            ))}
          </View>
        )}

        {/* ── Aucun résultat ──────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <View className="items-center py-[40px]">
            <Text className="font-inter-regular text-body-m text-text-muted">
              {t('search.empty')}
            </Text>
          </View>
        )}

        {/* ── Comment ça marche ──────────────────────────────────────────── */}
        <InfoBox />
      </ScrollView>

      <GarantActionsSheet ref={sheetRef} />
    </SafeScreenView>
  );
}