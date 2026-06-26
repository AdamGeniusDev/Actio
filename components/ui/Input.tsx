import { View, Text, TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Sizes } from '@/constants/theme';

interface Props extends TextInputProps {
  label?:     string;
  error?:     string;
  icon?:      LucideIcon;
  rightSlot?: React.ReactNode;
}

export function Input({ label, error, icon: Icon, rightSlot, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  const iconColor = error ? '#FF3B5C' : focused ? '#FF6B1A' : '#4A6480';

  return (
    <View style={s.wrapper}>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={[s.container, focused && s.focused, !!error && s.errBorder]}>
        {Icon && (
          <View style={s.iconLeft}>
            <Icon size={20} color={iconColor} />
          </View>
        )}
        <TextInput
          style={[s.input, style]}
          placeholderTextColor="#2A3D52"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightSlot}
      </View>
      {error && <Text style={s.errMsg}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { gap: 6 },
  container: { flexDirection: 'row', alignItems: 'center', height: Sizes.input, backgroundColor: '#0D1520', borderRadius: 14, borderWidth: 1, borderColor: '#1E3048', paddingHorizontal: 12 },
  focused:   { borderColor: '#FF6B1A' },
  errBorder: { borderColor: '#FF3B5C' },
  iconLeft:  { marginRight: 10 },
  input:     { flex: 1, color: '#F0F6FF', fontFamily: 'Inter-Regular', fontSize: 15 },
  label:     { fontFamily: 'Inter-Medium', fontSize: 13, color: '#8BA3BE' },
  errMsg:    { fontFamily: 'Inter-Regular', fontSize: 12, color: '#FF3B5C' },
});