import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@/constants/theme';

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <View className="flex-row items-center">
      <Text
        style={{ fontFamily: 'ClashDisplay-Bold', fontSize: size, letterSpacing: 2.5 }}
        className="text-text-primary"
      >
        ACTI
      </Text>
      <LinearGradient
        {...Gradients.accent}
        style={{ 
          width: size * 0.85, 
          height: size * 0.85, 
          borderRadius: size, 
          marginLeft: 2,
          alignItems:'center',
          justifyContent: 'center' 
        }}
      >
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: size,
            backgroundColor: 'white',
          }}
        />
      </LinearGradient>
    </View>
  );
}