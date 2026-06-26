import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '@/stores/ui.store';

const STYLES = {
  success: { bg: 'rgba(0,214,143,0.12)',  border: '#00D68F', text: '#00D68F', icon: '✅' },
  error:   { bg: 'rgba(255,59,92,0.12)',  border: '#FF3B5C', text: '#FF3B5C', icon: '❌' },
  warning: { bg: 'rgba(255,184,0,0.12)',  border: '#FFB800', text: '#FFB800', icon: '⚠️'  },
  info:    { bg: 'rgba(77,158,255,0.12)', border: '#4D9EFF', text: '#4D9EFF', icon: 'ℹ️'  },
} as const;

export function ToastHost() {
  const { toasts, removeToast } = useUIStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[s.host, { top: insets.top + 8 }]}
      pointerEvents="none"
    >
      {toasts.map(toast => {
        const c = STYLES[toast.type];
        setTimeout(() => removeToast(toast.id), 3000);
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={[s.toast, { backgroundColor: c.bg, borderColor: c.border }]}
          >
            <Text style={s.icon}>{c.icon}</Text>
            <Text style={[s.msg, { color: c.text }]}>{toast.message}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  host:  { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, maxWidth: 340 },
  icon:  { fontSize: 16 },
  msg:   { fontFamily: 'Inter-Medium', fontSize: 14, flex: 1, color: '#F0F6FF' },
});
