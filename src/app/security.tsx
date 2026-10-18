import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { Button, Field, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { authenticateBiometric, biometricAvailable, clearPin, hasPin, setPin } from '@/lib/lock';
import { useAppStore } from '@/lib/store';

export default function Security() {
  const { t } = useT();
  const lockEnabled = useAppStore((s) => s.lockEnabled);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const setLock = useAppStore((s) => s.setLock);
  const [pinExists, setPinExists] = useState(false);
  const [canBio, setCanBio] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');

  useEffect(() => {
    hasPin().then(setPinExists);
    biometricAvailable().then(setCanBio);
  }, []);

  const savePin = async () => {
    if (pin1 !== pin2) return Alert.alert(t('security.pinMismatch'));
    await setPin(pin1);
    setPinExists(true);
    setEditingPin(false);
    setPin1('');
    setPin2('');
    setLock({ lockEnabled: true });
  };

  const toggleLock = async (on: boolean) => {
    if (on && !pinExists) {
      setEditingPin(true);
      return;
    }
    if (!on) {
      await clearPin();
      setPinExists(false);
      setLock({ lockEnabled: false, biometricEnabled: false });
      return;
    }
    setLock({ lockEnabled: true });
  };

  const toggleBio = async (on: boolean) => {
    if (on && !(await authenticateBiometric(t('security.unlockPrompt'), t('common.cancel')))) return;
    setLock({ biometricEnabled: on });
  };

  const pinValid = /^\d{4,6}$/.test(pin1);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={styles.body}>{t('security.enableLock')}</Text>
        <Switch value={lockEnabled} onValueChange={toggleLock} trackColor={{ true: colors.primary }} />
      </View>
      {canBio && (
        <View style={[styles.row, { justifyContent: 'space-between', opacity: lockEnabled ? 1 : 0.4 }]}>
          <Text style={styles.body}>{t('security.biometric')}</Text>
          <Switch value={biometricEnabled} disabled={!lockEnabled} onValueChange={toggleBio} trackColor={{ true: colors.primary }} />
        </View>
      )}
      {lockEnabled && !editingPin && <Button title={t('security.changePin')} variant="secondary" onPress={() => setEditingPin(true)} />}
      {editingPin && (
        <View style={{ gap: spacing.md }}>
          <Field label={t('security.enterPin')} value={pin1} onChangeText={(v) => setPin1(v.replace(/\D/g, ''))} keyboardType="number-pad" secureTextEntry maxLength={6} autoFocus />
          <Field label={t('security.confirmPin')} value={pin2} onChangeText={(v) => setPin2(v.replace(/\D/g, ''))} keyboardType="number-pad" secureTextEntry maxLength={6} />
          <Button title={t('common.save')} onPress={savePin} disabled={!pinValid || pin2.length < 4} />
        </View>
      )}
    </ScrollView>
  );
}
