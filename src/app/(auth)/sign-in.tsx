import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Field, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { normalizePhone, signInWithApple, signInWithOAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Method = 'email' | 'phone';

export default function SignIn() {
  const { t } = useT();
  const [method, setMethod] = useState<Method>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('auth.invalid'));
    } finally {
      setBusy(null);
    }
  };

  const submitEmail = () =>
    run('email', async () => {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) Alert.alert(t('auth.signUp'), t('auth.checkEmail'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    });

  const sendCode = () =>
    run('phone', async () => {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
      if (error) throw error;
      setCodeSent(true);
    });

  const verifyCode = () =>
    run('phone', async () => {
      const { error } = await supabase.auth.verifyOtp({ phone: normalizePhone(phone), token: code.trim(), type: 'sms' });
      if (error) throw error;
    });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>{isSignUp ? t('auth.signUp') : t('auth.signIn')}</Text>

          <View style={styles.row}>
            <Chip label={t('auth.withEmail')} selected={method === 'email'} onPress={() => setMethod('email')} />
            <Chip label={t('auth.withPhone')} selected={method === 'phone'} onPress={() => setMethod('phone')} />
          </View>

          {method === 'email' ? (
            <>
              <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
              <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete={isSignUp ? 'new-password' : 'current-password'} />
              <Button title={isSignUp ? t('auth.signUp') : t('auth.signIn')} onPress={submitEmail} loading={busy === 'email'} disabled={!email || password.length < 6} />
              <Button title={isSignUp ? t('auth.haveAccount') : t('auth.noAccount')} variant="ghost" onPress={() => setIsSignUp((v) => !v)} />
            </>
          ) : !codeSent ? (
            <>
              <Field label={t('auth.phone')} placeholder={t('auth.phoneHint')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
              <Button title={t('auth.sendCode')} onPress={sendCode} loading={busy === 'phone'} disabled={phone.length < 8} />
            </>
          ) : (
            <>
              <Field label={t('auth.code')} value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" />
              <Button title={t('auth.verify')} onPress={verifyCode} loading={busy === 'phone'} disabled={code.length < 4} />
            </>
          )}

          <Text style={{ textAlign: 'center', color: colors.muted }}>{t('auth.or')}</Text>

          <Button title={t('auth.google')} variant="secondary" icon="logo-google" loading={busy === 'google'} onPress={() => run('google', async () => void (await signInWithOAuth('google')))} />
          {Platform.OS === 'ios' && appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={{ height: 50 }}
              onPress={() => run('apple', async () => void (await signInWithApple()))}
            />
          ) : (
            <Button title={t('auth.apple')} variant="secondary" icon="logo-apple" loading={busy === 'apple'} onPress={() => run('apple', async () => void (await signInWithApple()))} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
