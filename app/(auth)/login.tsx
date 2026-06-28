import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoiderScrollView } from '@good-react-native/keyboard-avoider';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { loginSchema, type LoginForm } from '@/utils/validator';
import { useLoginMutation, useGoogleSignInMutation } from '@/hooks/api/useAuth';
import { signInWithGoogle } from '@/lib/googleAuth';
import { useUIStore } from '@/stores/ui.store';
import { ApiError } from '@/lib/api/client';

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});

  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleSignInMutation();

  const handleSubmit = () => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LoginForm;
        fieldErrors[key] = t(`login.errors.${key}`);
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    loginMutation.mutate(result.data, {
      onSuccess: () => router.replace('/(app)/(home)' as any),
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : t('login.errors.generic');
        addToast({ message, type: 'error' });
      },
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return; // annulé par l'utilisateur, pas une erreur à afficher

      googleMutation.mutate(idToken, {
        onSuccess: () => router.replace('/(app)/(home)' as any),
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : t('login.errors.generic');
          addToast({ message, type: 'error' });
        },
      });
    } catch {
      addToast({ message: t('login.errors.googleUnavailable'), type: 'error' });
    }
  };

  const isLoading = loginMutation.isPending || googleMutation.isPending;

  return (
    <SafeScreenView withTabBar={false}>
      <KeyboardAvoiderScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 justify-center">
          <View className="items-center mb-3xl">
            <Logo size={36} />
          </View>

          <Text className="font-space-bold text-display-l text-text-primary text-center mb-xs">
            {t('login.title')}
          </Text>
          <Text className="font-inter-regular text-body-m text-text-secondary text-center mb-2xl">
            {t('login.subtitle')}
          </Text>

          <View className="gap-lg">
            <View>
              <Text className="font-inter-medium text-label text-text-secondary mb-sm">
                {t('login.emailLabel')}
              </Text>
              <Input
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                icon={Mail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View>
              <View className="flex-row items-center justify-between mb-sm">
                <Text className="font-inter-medium text-label text-text-secondary">
                  {t('login.passwordLabel')}
                </Text>
                <Pressable onPress={() => router.push('/(auth)/forgot-password' as any)}>
                  <Text className="font-inter-semibold text-body-s text-accent">
                    {t('login.forgotPassword')}
                  </Text>
                </Pressable>
              </View>
              <Input
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                icon={Lock}
                rightSlot={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={{ marginLeft: 10 }}>
                    {showPassword ? <EyeOff size={20} color="#4A6480" /> : <Eye size={20} color="#4A6480" />}
                  </Pressable>
                }
                secureTextEntry={!showPassword}
                error={errors.password}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          <Button
            label={t('login.submit')}
            variant="primary"
            size="l"
            rightIcon={ArrowRight}
            onPress={handleSubmit}
            loading={loginMutation.isPending}
            disabled={isLoading}
            className="mt-2xl"
          />

          <View className="flex-row items-center my-2xl">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="font-inter-regular text-body-s text-text-muted mx-md">{t('common.or')}</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          <Button
            label={t('common.continueWithGoogle')}
            variant="secondary"
            size="l"
            leftIcon={GoogleIcon}
            onPress={handleGoogleSignIn}
            loading={googleMutation.isPending}
            disabled={isLoading}
          />

          <View className="flex-row justify-center items-center mt-3xl">
            <Text className="font-inter-regular text-body-m text-text-secondary">
              {t('login.noAccount')}{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register' as any)}>
              <Text className="font-inter-semibold text-body-m text-accent">{t('login.signUp')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoiderScrollView>
    </SafeScreenView>
  );
}