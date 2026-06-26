import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';

interface Props {
  label:    string;
  variant?: BadgeVariant;
  dot?:     boolean;
}

const COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  accent:  { bg: 'rgba(255,107,26,0.12)',  text: '#FF6B1A' },
  success: { bg: 'rgba(0,214,143,0.12)',   text: '#00D68F' },
  danger:  { bg: 'rgba(255,59,92,0.12)',   text: '#FF3B5C' },
  warning: { bg: 'rgba(255,184,0,0.12)',   text: '#FFB800' },
  info:    { bg: 'rgba(77,158,255,0.12)',  text: '#4D9EFF' },
  ghost:   { bg: 'rgba(255,255,255,0.06)', text: '#8BA3BE' },
};

export function Badge({ label, variant = 'ghost', dot = false }: Props) {
  const c = COLORS[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      {dot && <View style={[s.dot, { backgroundColor: c.text }]} />}
      <Text style={[s.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: 'Inter-Bold', fontSize: 10 },
});
