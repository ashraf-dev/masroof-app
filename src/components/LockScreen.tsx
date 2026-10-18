import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authenticateBiometric, biometricAvailable, verifyPin } from '@/lib/lock';
import { useAppStore } from '@/lib/store';
import { useT } from '@/i18n';
import { Button, styles as ui } from './ui';
import { colors, radius, spacing } from './theme';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useT();
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [canBio, setCanBio] = useState(false);

  const tryBiometric = useCallback(async () => {
    if (await authenticateBiometric(t('security.unlockPrompt'), t('common.cancel'))) onUnlock();
  }, [onUnlock, t]);

  useEffect(() => {
    if (!biometricEnabled) return;
    biometricAvailable().then((ok) => {
      setCanBio(ok);
      if (ok) tryBiometric();
    });
  }, [biometricEnabled, tryBiometric]);

  const submit = async (value: string) => {
    if (await verifyPin(value)) onUnlock();
    else {
      setError(true);
      setPin('');
    }
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, zIndex: 100, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }]}>
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
        <Text style={ui.h2}>{t('appName')}</Text>
        <Text style={ui.muted}>{t('security.enterPin')}</Text>
      </View>
      <TextInput
        value={pin}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, '').slice(0, 6);
          setPin(digits);
          setError(false);
          if (digits.length === 6) submit(digits);
        }}
        keyboardType="number-pad"
        secureTextEntry
        autoFocus={!biometricEnabled}
        maxLength={6}
        style={{ backgroundColor: colors.card, borderRadius: radius.md, fontSize: 28, textAlign: 'center', paddingVertical: spacing.md, letterSpacing: 12, color: colors.text }}
      />
      {error && <Text style={{ color: colors.danger, textAlign: 'center' }}>{t('security.wrongPin')}</Text>}
      <Button title={t('security.unlock')} onPress={() => submit(pin)} disabled={pin.length < 4} />
      {canBio && <Button title={t('security.useBiometric')} variant="ghost" icon="finger-print" onPress={tryBiometric} />}
    </SafeAreaView>
  );
}
