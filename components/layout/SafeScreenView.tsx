import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ViewProps {
  children:     React.ReactNode;
  withTabBar?:  boolean;
  withGradient?: boolean;
  className?:   string;
}

export function SafeScreenView({
  children,
  withTabBar   = false,
  withGradient = false,
  className,
  style,
  ...props
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-background ${className ?? ''}`}
      style={[
        {
          paddingTop:    insets.top,
          paddingBottom: withTabBar ? insets.bottom + 86 : insets.bottom,
        },
        style,
      ]}
      {...props}
    >
      {/* Dégradé accent optionnel — purement décoratif, ne capte aucun touch */}
      {withGradient && (
        <LinearGradient
          colors={['rgba(255,107,26,0.35)', 'rgba(255,107,26,0.012)', 'rgba(8,13,20,0)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top:      0,
            left:     0,
            right:    0,
            height:   460,
          }}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}