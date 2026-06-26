// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, View, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadows, Gradients, Sizes, Animation } from '@/constants/theme';
import type { PressableProps } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type BtnSize = 'l' | 'm' | 's';

// Accepte lucide-react-native ET tout autre composant icône (ex: GoogleIcon)
type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label:      string;
  variant?:   Variant;
  size?:      BtnSize;
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  IconComponent;
  rightIcon?: IconComponent;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const HEIGHT: Record<BtnSize, number> = { l: Sizes.button.l, m: Sizes.button.m, s: Sizes.button.s };

const LABEL_SIZE: Record<BtnSize, string> = {
  l: 'text-body-l',
  m: 'text-body-m',
  s: 'text-body-s',
};

const ICON_SIZE: Record<BtnSize, number> = {
  l: 20,
  m: 18,
  s: 16,
};

const LABEL_COLOR: Record<Variant, string> = {
  primary:   'text-white',
  secondary: 'text-primary',
  danger:    'text-white',
  success:   'text-white',
  ghost:     'text-accent',
};

const ICON_COLOR: Record<Variant, string> = {
  primary:   '#FFFFFF',
  secondary: '#F0F6FF',
  danger:    '#FFFFFF',
  success:   '#FFFFFF',
  ghost:     '#FF6B1A',
};

const GRADIENT_CFG = {
  primary: { gradient: Gradients.accent,  shadow: Shadows.accent  },
  danger:  { gradient: Gradients.danger,  shadow: Shadows.accent  },
  success: { gradient: Gradients.success, shadow: Shadows.success },
} as const;

const baseLayout = {
  flexDirection: 'row' as const,
  alignItems:    'center' as const,
  justifyContent:'center' as const,
  borderRadius:  14,
  paddingHorizontal: 24,
  gap: 8,
  overflow: 'hidden' as const,
};

// ─── Composant ────────────────────────────────────────────────────────────────

export function Button({
  label,
  variant   = 'primary',
  size      = 'l',
  loading   = false,
  fullWidth = false,
  leftIcon:  LeftIcon,
  rightIcon: RightIcon,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isGradient = variant in GRADIENT_CFG;
  const isDisabled = disabled || loading;
  const cfg         = GRADIENT_CFG[variant as keyof typeof GRADIENT_CFG];

  const containerStyle = {
    ...baseLayout,
    height:  HEIGHT[size],
    opacity: isDisabled ? 0.5 : 1,
  };

  const iconColor = ICON_COLOR[variant];
  const iconSize  = ICON_SIZE[size];

  const content = loading
    ? <ActivityIndicator color={variant === 'ghost' ? '#FF6B1A' : '#FFFFFF'} size="small" />
    : (
      <>
        {LeftIcon && <LeftIcon size={iconSize} color={iconColor} />}
        <Text className={`font-inter-regular text-body-m ${LABEL_COLOR[variant]}`}>
          {label}
        </Text>
        {RightIcon && <RightIcon size={iconSize} color={iconColor} />}
      </>
    );

  return (
    <Animated.View style={[animStyle, fullWidth && { alignSelf: 'stretch' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, Animation.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1,    Animation.spring.press); }}
        disabled={isDisabled}
        {...props}
      >
        {isGradient ? (
          <LinearGradient
            {...cfg.gradient}
            style={[containerStyle, Platform.OS === 'ios' ? cfg.shadow : { elevation: 4 }]}
          >
            {content}
          </LinearGradient>
        ) : variant === 'secondary' ? (
          <View style={[containerStyle, { backgroundColor: '#172436', borderWidth: 1, borderColor: '#2A4560' }]}>
            {content}
          </View>
        ) : (
          <View style={containerStyle}>
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}