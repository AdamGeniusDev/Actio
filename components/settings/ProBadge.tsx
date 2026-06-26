import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';

interface Props {
  /** 'compact' = pastille "PRO" inline (listes). 'full' = pilule "Utilisateur Pro" (page Profil). */
  variant?: 'compact' | 'full';
  /** Override du label par défaut — utile pour passer une string traduite (t('hero.pro_badge')). */
  label?: string;
}

export function ProBadge({ variant = 'compact', label }: Props) {
  const text = label ?? (variant === 'compact' ? 'PRO' : 'Utilisateur Pro');

  return (
    <LinearGradient
      colors={['#FF6B1A', '#FF3D00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: variant === 'compact' ? 6 : 12,
        paddingVertical: variant === 'compact' ? 2 : 6,
        borderRadius: 999,
        gap: variant === 'compact' ? 3 : 6,
      }}
    >
      <Crown size={variant === 'compact' ? 10 : 13} color="#fff" strokeWidth={2} />
      <Text
        className={`font-inter-bold text-white ${variant === 'compact' ? 'text-[10px]' : 'text-[12px]'}`}
        style={{ includeFontPadding: false }}
      >
        {text}
      </Text>
    </LinearGradient>
  );
}