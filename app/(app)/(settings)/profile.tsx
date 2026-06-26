import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  Pencil,
} from 'lucide-react-native';
import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { ProBadge } from '@/components/settings/ProBadge';
import { EditTextSheet, type EditTextSheetHandle } from '@/components/settings/EditTextSheet';
import { Shadows, Animation, Gradients } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import type { LucideIcon } from 'lucide-react-native';

// ─── Validation ───────────────────────────────────────────────────────────────

/** Champ vide autorisé (téléphone optionnel) ; sinon exige 8 à 15 chiffres
 *  significatifs, avec + / espaces / tirets / parenthèses tolérés. */
function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const formatOk = /^\+?[0-9\s\-().]+$/.test(trimmed);
  const digitsOnly = trimmed.replace(/\D/g, '');
  return formatOk && digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  valueAccent?: boolean;
  badgeLabel?: string;
  badgeVariant?: 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  onPress?: () => void;
  danger?: boolean;
  readOnly?: boolean;
}

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
}

type EditableField = 'name' | 'phone';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <View
      className="flex-1 items-center justify-center rounded-xl py-3 px-2 bg-card"
      style={shadowStyles.card}
    >
      <Text
        className="font-space-bold text-display-m"
        style={{ color, includeFontPadding: false } as any}
      >
        {value}
      </Text>
      <Text className="font-inter-medium text-label text-text-muted mt-0.5 tracking-widest uppercase">
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon: Icon,
  label,
  value,
  valueAccent = false,
  badgeLabel,
  badgeVariant = 'accent',
  onPress,
  danger = false,
  readOnly = false,
}: MenuRowProps) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const inner = (
    <>
      <View className="w-8 h-8 items-center justify-center mr-3">
        <Icon size={18} color={danger ? '#FF3B5C' : '#8BA3BE'} strokeWidth={1.8} />
      </View>

      <Text
        className={`flex-1 font-inter-medium text-body-m ${
          danger ? 'text-danger' : 'text-text-primary'
        }`}
      >
        {label}
      </Text>

      {value && (
        <Text
          className={`font-inter-regular text-body-s mr-1 ${
            valueAccent ? 'text-accent' : 'text-text-secondary'
          }`}
        >
          {value}
        </Text>
      )}
      {badgeLabel && (
        <View className="mr-2">
          <Badge label={badgeLabel} variant={badgeVariant} />
        </View>
      )}
      {!danger && !readOnly && (
        <ChevronRight size={16} color="#4A6480" strokeWidth={2} />
      )}
    </>
  );

  if (readOnly) {
    return (
      <View className="flex-row items-center px-lg py-[15px]">
        {inner}
      </View>
    );
  }

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        onPress={onPress}
        className="flex-row items-center px-lg py-[15px]"
      >
        {inner}
      </Pressable>
    </Animated.View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-card rounded-xl mx-2xl overflow-hidden"
      style={shadowStyles.card}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-subtle mx-lg" />;
}

function SectionTitle({ label }: { label: string }) {
  return (
    <Text className="font-inter-semibold text-label text-text-muted uppercase tracking-widest px-2xl mb-sm mt-3xl">
      {label}
    </Text>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ProfileAvatar({
  initials,
  avatarUri,
  onEditPress,
}: {
  initials: string;
  avatarUri: string | null;
  onEditPress: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[aStyle, shadowStyles.avatarGlow]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, Animation.spring.press); }}
        className="relative"
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={avatarStyles.circle} />
        ) : (
          <LinearGradient
            colors={Gradients.accent.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={avatarStyles.circle}
          >
            <Text style={avatarStyles.initials}>{initials}</Text>
          </LinearGradient>
        )}

        <Pressable
          onPress={onEditPress}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-raised items-center justify-center"
          style={shadowStyles.card}
          hitSlop={8}
        >
          <Pencil size={12} color="#FF6B1A" strokeWidth={2.2} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation('profile');
  const { user } = useAuthStore();

  // TODO [API]: remplacer par useQuery(QUERY_KEYS.user.me) + mutation PATCH /users/me
  const [name, setName]   = useState(user?.name ?? 'Adama Diallo');
  const [phone, setPhone] = useState<string | null>(user?.phone ?? null);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const email   = user?.email ?? 'adama.diallo@actio.app';
  const isPro   = user?.isPro ?? true;
  const score   = 87;
  const tasks   = 47;
  const streak  = 7;

  const memberSinceDate  = user?.createdAt ? new Date(user.createdAt) : new Date('2025-01-14');
  const memberSinceLabel = memberSinceDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Photo de profil ─────────────────────────────────────────────────────────
  // expo-image-picker : demande la permission galerie, ouvre le sélecteur,
  // recadre en carré, et stocke l'URI locale pour preview immédiate.
  // TODO [API]: une fois result.assets[0].uri obtenu, uploader vers ton storage
  // (ex: Supabase Storage) puis PATCH /users/me { avatarUrl: <url distante> }.
  // Pour l'instant avatarUri pointe vers le fichier local de l'appareil, pas
  // vers une URL distante — à remplacer par l'URL retournée par l'upload.
  const handlePickAvatar = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('avatar.permission_title'),
          t('avatar.permission_message'),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        // TODO [API]: upload + PATCH /users/me { avatarUrl }
      }
    } catch (err) {
      // En dev, on veut voir l'erreur plutôt qu'un échec silencieux —
      // si expo-image-picker n'est pas lié nativement, c'est ici qu'on le verra.
      console.error('[ProfileScreen] handlePickAvatar failed:', err);
      Alert.alert(t('avatar.error_title'), t('avatar.error_message'));
    }
  }, [t]);

  // ── Edition texte (sheet partagé entre prénom et téléphone) ─────────────────
  const sheetRef = useRef<EditTextSheetHandle>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue]     = useState('');
  const [error, setError]               = useState<string | null>(null);

  const openEdit = useCallback((field: EditableField, currentValue: string) => {
    setEditingField(field);
    setDraftValue(currentValue);
    setError(null);
    sheetRef.current?.present();
  }, []);

  const handleChangeDraft = useCallback((text: string) => {
    setDraftValue(text);
    if (error) setError(null);
  }, [error]);

  const handleSave = useCallback(() => {
    const trimmed = draftValue.trim();

    if (editingField === 'name') {
      if (!trimmed) {
        setError(t('edit.name_error_required'));
        return;
      }
      setName(trimmed);
      // TODO [API]: PATCH /users/me { name: trimmed }
    }

    if (editingField === 'phone') {
      if (!isValidPhone(trimmed)) {
        setError(t('edit.phone_error_invalid'));
        return;
      }
      setPhone(trimmed || null);
      // TODO [API]: PATCH /users/me { phone: trimmed || null }
    }

    setError(null);
    sheetRef.current?.dismiss();
  }, [editingField, draftValue, t]);

  const sheetConfig = editingField === 'phone'
    ? {
        title: t('edit.phone_title'),
        placeholder: t('edit.phone_placeholder'),
        keyboardType: 'phone-pad' as const,
      }
    : {
        title: t('edit.name_title'),
        placeholder: t('edit.name_placeholder'),
        keyboardType: 'default' as const,
      };

  return (
    <SafeScreenView withGradient>
      <ScreenHeader
        title={t('header.title')}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-2xl"
      >
        <View className="items-center pt-xl pb-2xl px-2xl">
          <ProfileAvatar
            initials={initials}
            avatarUri={avatarUri}
            onEditPress={handlePickAvatar}
          />

          <Text
            className="font-space-bold text-display-m text-text-primary text-center mt-lg"
            style={{ includeFontPadding: false, lineHeight: 36 } as any}
          >
            {name}
          </Text>

          {isPro && (
            <View className="mt-sm">
              <ProBadge variant="full" label={t('hero.pro_badge')} />
            </View>
          )}

          <View className="flex-row gap-sm mt-2xl w-full">
            <StatCard value={`${score}%`} label={t('stats.score')} color="#00D68F" />
            <StatCard value={tasks} label={t('stats.tasks')} color="#F0F6FF" />
            <StatCard value={`${streak}j`} label={t('stats.streak')} color="#FFB800" />
          </View>
        </View>

        <SectionTitle label={t('sections.personal_info')} />
        <SectionCard>
          <MenuRow
            icon={User}
            label={t('personal_info.username')}
            value={name}
            onPress={() => openEdit('name', name)}
          />
          <Divider />
          <MenuRow
            icon={Mail}
            label={t('personal_info.email')}
            value={email}
            readOnly
          />
          <Divider />
          <MenuRow
            icon={Phone}
            label={t('personal_info.phone')}
            value={phone ?? t('personal_info.phone_add')}
            valueAccent={!phone}
            onPress={() => openEdit('phone', phone ?? '')}
          />
          <Divider />
          <MenuRow
            icon={Calendar}
            label={t('personal_info.member_since')}
            value={memberSinceLabel}
            readOnly
          />
        </SectionCard>
      </ScrollView>

      <EditTextSheet
        ref={sheetRef}
        title={sheetConfig.title}
        placeholder={sheetConfig.placeholder}
        keyboardType={sheetConfig.keyboardType}
        value={draftValue}
        onChangeText={handleChangeDraft}
        onSave={handleSave}
        saveLabel={t('edit.save')}
        cancelLabel={t('edit.cancel')}
        error={error}
      />
    </SafeScreenView>
  );
}

// ─── Styles (uniquement ce qui ne peut pas être exprimé en NativeWind) ────────

const shadowStyles = StyleSheet.create({
  card: Shadows.card as any,
  avatarGlow: Shadows.fab as any,
});

const avatarStyles = StyleSheet.create({
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
});