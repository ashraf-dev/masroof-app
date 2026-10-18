import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, styles } from '@/components/ui';
import { colors, spacing } from '@/components/theme';
import { useT } from '@/i18n';
import { useAppStore } from '@/lib/store';

export default function Welcome() {
  const { t, lang } = useT();
  const setLang = useAppStore((s) => s.setPreferredLanguage);
  return (
    <SafeAreaView style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <Chip label="عربي" selected={lang === 'ar'} onPress={() => setLang('ar')} />
        <Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} />
      </View>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="wallet" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.h1, { textAlign: 'center' }]}>{t('appName')}</Text>
        <Text style={[styles.h2, { textAlign: 'center' }]}>{t('auth.welcomeTitle')}</Text>
        <Text style={[styles.body, { textAlign: 'center', color: colors.muted }]}>{t('auth.welcomeBody')}</Text>
      </View>
      <Button title={t('auth.start')} onPress={() => router.push('/sign-in')} />
    </SafeAreaView>
  );
}
