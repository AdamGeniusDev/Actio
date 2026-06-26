import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoiderScrollView } from '@good-react-native/keyboard-avoider';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Mail, MailCheck } from 'lucide-react-native';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Gradients } from '@/constants/theme';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/utils/validator';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();

  const [email,     setEmail]     = useState('');
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [errors,    setErrors]    = useState<Partial<Record<keyof ForgotPasswordForm, string>>>({});

  const handleSubmit = async () => {
    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ForgotPasswordForm;
        fieldErrors[key] = t(`forgotPassword.errors.${key}`);
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      // TODO: mutation TanStack Query → useForgotPassword
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      // TODO: resend mutation
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeScreenView withTabBar={false}>
      <KeyboardAvoiderScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4">

          {/* Bouton retour */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2 mb-xl"
          >
            <ArrowLeft size={24} color="#F0F6FF" />
          </Pressable>

          {!sent ? (

            // ── Formulaire ─────────────────────────────────────────────────
            <Animated.View entering={FadeIn.duration(250)} className="flex-1">

              <View className="items-center mb-3xl">
                <Logo size={28} />
              </View>

              <Text className="font-space-bold text-display-l text-text-primary mb-xs">
                {t('forgotPassword.title')}
              </Text>
              <Text className="font-inter-regular text-body-m text-text-secondary mb-2xl">
                {t('forgotPassword.subtitle')}
              </Text>

              <Input
                placeholder={t('forgotPassword.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                icon={Mail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />

              <Button
                label={t('forgotPassword.submit')}
                variant="primary"
                size="l"
                rightIcon={ArrowRight}
                loading={loading}
                onPress={handleSubmit}
                className="mt-2xl"
              />

              <Pressable
                onPress={() => router.push('/(auth)/login' as any)}
                className="items-center mt-3xl"
              >
                <Text className="font-inter-semibold text-body-m text-text-secondary">
                  {t('forgotPassword.backToLogin')}
                </Text>
              </Pressable>

            </Animated.View>

          ) : (

            // ── Succès ─────────────────────────────────────────────────────
            <Animated.View
              entering={FadeIn.duration(350)}
              className="flex-1 justify-center items-center"
            >
              <LinearGradient
                {...Gradients.accent}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 28,
                }}
              >
                <MailCheck size={36} color="#fff" strokeWidth={1.8} />
              </LinearGradient>

              <Text className="font-inter-regular text-body-m text-text-secondary text-center mb-3xl leading-6 px-xl">
                {t('forgotPassword.success')}
              </Text>

              <Button
                label={t('forgotPassword.backToLogin')}
                variant="primary"
                size="l"
                onPress={() => router.push('/(auth)/login' as any)}
              />

              {/* Renvoi */}
              <Pressable
                onPress={handleResend}
                disabled={resending}
                className="items-center mt-xl py-sm"
                style={{ opacity: resending ? 0.4 : 1 }}
              >
                <Text className="font-inter-regular text-body-m text-text-secondary">
                  {t('forgotPassword.noEmail')}{' '}
                  <Text className="font-inter-semibold text-accent">
                    {t('forgotPassword.resend')}
                  </Text>
                </Text>
              </Pressable>

            </Animated.View>

          )}
        </View>
      </KeyboardAvoiderScrollView>
    </SafeScreenView>
  );
}