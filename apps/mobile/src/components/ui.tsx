import { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

export const colors = {
  ink: '#172B2D', muted: '#647477', brand: '#245C50', brandSoft: '#E7F0EC',
  paper: '#F8F7F4', white: '#FFFFFF', line: '#E6E4DE', gold: '#C59642', danger: '#B83B32',
};

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Heading({ children, eyebrow }: PropsWithChildren<{ eyebrow?: string }>) {
  return <View style={styles.heading}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}<Text style={styles.title}>{children}</Text></View>;
}

export function Button({ children, onPress, disabled, variant = 'primary' }: PropsWithChildren<{ onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' }>) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, variant === 'secondary' && styles.secondaryButton, pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>{children}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#9BA5A2" autoCapitalize="none" style={styles.input} {...props} /></View>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Loading({ label = 'Loading your learning space…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.brand} /><Text style={styles.muted}>{label}</Text></View>;
}

export function Notice({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{children}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 22, paddingTop: 22 },
  heading: { marginBottom: 22, gap: 8 }, eyebrow: { color: colors.brand, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.7 },
  button: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: colors.brand },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' }, secondaryButton: { backgroundColor: colors.brandSoft }, secondaryText: { color: colors.brand }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.55 },
  field: { gap: 8, marginBottom: 16 }, label: { color: colors.ink, fontSize: 14, fontWeight: '600' }, input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 15, fontSize: 15 },
  card: { padding: 18, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 10 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, muted: { color: colors.muted, fontSize: 14 }, notice: { padding: 15, borderRadius: 14, backgroundColor: '#FCEDEA', gap: 10 }, noticeText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});
