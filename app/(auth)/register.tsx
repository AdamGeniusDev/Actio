import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoiderScrollView } from '@good-react-native/keyboard-avoider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react-native';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { Animation } from '@/constants/theme';
import { registerSchema, type RegisterForm } from '@/utils/validator';
import { useRegisterMutation, useGoogleSignInMutation } from '@/hooks/api/useAuth';
import { signInWithGoogle } from '@/lib/googleAuth';
import { useUIStore } from '@/stores/ui.store';
import { ApiError } from '@/lib/api/client';

const STRENGTH_COLORS = ['#FF3B5C', '#FFB800', '#4D9EFF', '#00D68F'];

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export default function RegisterScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const registerMutation = useRegisterMutation();
  const googleMutation = useGoogleSignInMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});

  const strength = getPasswordStrength(password);

  const checkboxScale = useSharedValue(1);
  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const canSubmit =
  checked &&
  name.trim().length > 0 &&
  email.trim().length > 0 &&
  password.trim().length > 0;


  const handleSubmit = () => {
    const result = registerSchema.safeParse({ name, email, password });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof RegisterForm;
        fieldErrors[key] = t(`register.errors.${key}`);
      });
      setErrors(fieldErrors);
      return;
    }

    if (!canSubmit) return;
    setErrors({});
    registerMutation.mutate(result.data, {
      onSuccess: () => router.replace('/(app)/(home)' as any),
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : t('register.errors.generic');
        addToast({ message, type: 'error' });
      },
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return;

      googleMutation.mutate(idToken, {
        onSuccess: () => router.replace('/(app)/(home)' as any),
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : t('register.errors.generic');
          addToast({ message, type: 'error' });
        },
      });
    } catch {
      addToast({ message: t('register.errors.googleUnavailable'), type: 'error' });
    }
  };

  const isLoading = registerMutation.isPending || googleMutation.isPending;

  return (
    <SafeScreenView withTabBar={false}>
      <KeyboardAvoiderScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4">
          {/* Title */}
          <Text className="font-space-bold text-display-l text-text-primary mb-xs">
            {t('register.title')}
          </Text>
          <Text className="font-inter-regular text-body-m text-text-secondary mb-2xl">
            {t('register.subtitle')}
          </Text>

          {/* Form */}
          <View className="gap-lg">
            <Input
              placeholder={t('register.namePlaceholder')}
              value={name}
              onChangeText={setName}
              icon={User}
              error={errors.name}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              placeholder={t('register.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              icon={Mail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <View>
              <Input
                placeholder={t('register.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                icon={Lock}
                rightSlot={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    style={{ marginLeft: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#4A6480" />
                    ) : (
                      <Eye size={20} color="#4A6480" />
                    )}
                  </Pressable>
                }
                secureTextEntry={!showPassword}
                error={errors.password}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {password.length > 0 && (
                <View className="flex-row gap-xs mt-sm">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className="flex-1 h-1 rounded-full"
                      style={{
                        backgroundColor:
                          i < strength ? STRENGTH_COLORS[strength - 1] : '#1E3048',
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Terms checkbox */}
          <Pressable
            onPress={() => {
              checkboxScale.value = withSpring(0.9, Animation.spring.press, () => {
                checkboxScale.value = withSpring(1, Animation.spring.press);
              });
              setChecked((v) => !v);
            }}
            className="flex-row items-start gap-sm mt-2xl"
          >
            <Animated.View
              style={checkboxStyle}
              className={`w-5 h-5 rounded-xs border items-center justify-center mt-[2px] ${
                checked ? 'bg-accent border-accent' : 'border-border bg-transparent'
              }`}
            >
              {checked && <Check size={14} color="#F0F6FF" strokeWidth={3} />}
            </Animated.View>

            <Text className="font-inter-regular text-body-s text-text-secondary flex-1 leading-5">
              {t('register.termsPrefix')}{' '}
              <Text className="text-accent" onPress={() => router.push('/terms' as any)}>
                {t('register.termsLink')}
              </Text>{' '}
              {t('register.termsAnd')}{' '}
              <Text className="text-accent" onPress={() => router.push('/privacy' as any)}>
                {t('register.privacyLink')}
              </Text>
            </Text>
          </Pressable>

          {/* CTA */}
          <Button
            variant="primary"
            size="l"
            label={t('register.submit')}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            loading={registerMutation.isPending}
            className="mt-2xl"
          />

          {/* Divider */}
          <View className="flex-row items-center my-2xl">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="font-inter-regular text-body-m text-text-muted mx-md">{t('common.or')}</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          {/* Google */}
          <Button
            variant="secondary"
            size="l"
            label={t('common.continueWithGoogle')}
            leftIcon={GoogleIcon}
            onPress={handleGoogleSignIn}
            loading={googleMutation.isPending}
            disabled={isLoading}
          />

          {/* Footer */}
          <View className="flex-row justify-center items-center mt-auto pb-xl pt-2xl">
            <Text className="font-inter-regular text-body-m text-text-secondary">
              {t('register.alreadyAccount')}{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/login' as any)}>
              <Text className="font-inter-semibold text-body-m text-accent">{t('register.signIn')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoiderScrollView>
    </SafeScreenView>
  );
}