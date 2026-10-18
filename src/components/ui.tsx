import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const v = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={20} color={v.fg} />}
          <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variantStyles = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.card, fg: colors.text, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
    </View>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary }]}>
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function CategoryIcon({ icon, color, size = 40 }: { icon: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon as IconName} size={size * 0.5} color={color} />
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  onPress,
  left,
  danger,
  chevron = true,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  left?: ReactNode;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.bg }]}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress && chevron ? <Ionicons name="chevron-forward" size={18} color={colors.muted} style={styles.flipRtl} /> : null}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Empty({ text }: { text: string }) {
  return <Text style={[styles.muted, { textAlign: 'center', paddingVertical: spacing.xl }]}>{text}</Text>;
}

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  button: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, color: colors.muted, textAlign: 'left' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    // RN swaps left/right under RTL, so 'left' always means the start edge.
    textAlign: 'left',
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipText: { fontSize: 14, color: colors.text },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.card },
  rowTitle: { fontSize: 16, color: colors.text, textAlign: 'left' },
  rowValue: { fontSize: 15, color: colors.muted },
  muted: { fontSize: 13, color: colors.muted, textAlign: 'left' },
  section: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: spacing.lg, marginBottom: spacing.xs, paddingHorizontal: spacing.lg, textAlign: 'left' },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'left' },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'left' },
  body: { fontSize: 16, color: colors.text, textAlign: 'left' },
  flipRtl: { transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginStart: spacing.lg },
});
