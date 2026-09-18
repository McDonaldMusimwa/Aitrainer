import { useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={8} style={styles.backTarget}>
      <View style={styles.backCircle}><Text style={styles.arrow}>←</Text></View>
    </Pressable>
    <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
    <View style={styles.backTarget} />
  </View>;
}

export function Button({ children, onPress, secondary = false }: PropsWithChildren<{ onPress: () => void; secondary?: boolean }>) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && { color: colors.secondaryForeground }]}>{children}</Text>
  </Pressable>;
}

export function Input({ error, ...props }: TextInputProps & { error?: string }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? props.placeholder} placeholderTextColor={colors.ink}
      onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }}
      style={[styles.input, focused && styles.focused, !!error && styles.invalid, props.style]} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}

export function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.hero}>
    <Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text>
    <Text style={styles.heroSubtitle}>{subtitle}</Text>
  </View>;
}

export function Notice({ children }: PropsWithChildren) {
  return <View style={styles.notice}><Text accessibilityRole="alert" style={styles.noticeText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 36, minHeight: 48 },
  heading: { flex: 1, textAlign: 'center', fontSize: 23, fontWeight: '600', color: colors.ink, letterSpacing: -0.7 },
  backTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 25, lineHeight: 28, color: colors.ink },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  buttonText: { fontSize: 14, fontWeight: '500', color: colors.primaryForeground, textAlign: 'center' },
  secondary: { backgroundColor: colors.secondary }, pressed: { opacity: 0.7 },
  field: { gap: 7 }, input: { minHeight: 72, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 20, fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  focused: { borderColor: colors.ink, backgroundColor: colors.focus, borderWidth: 2, paddingHorizontal: 27 },
  invalid: { borderColor: colors.error }, error: { color: colors.error, fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  hero: { backgroundColor: colors.accent, minHeight: 202, borderRadius: 32, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 18 },
  heroTitle: { fontSize: 24, fontWeight: '600', textAlign: 'center', color: colors.accentForeground, letterSpacing: -0.7, lineHeight: 29 },
  heroSubtitle: { fontSize: 14, fontWeight: '500', lineHeight: 20, color: colors.accentForeground, textAlign: 'center' },
  notice: { backgroundColor: colors.secondary, padding: 16, borderRadius: 12, marginTop: 20 },
  noticeText: { fontSize: 14, lineHeight: 21, color: colors.secondaryForeground },
});
