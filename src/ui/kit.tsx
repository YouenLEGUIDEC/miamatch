import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as t } from './theme';
import { useApp } from '../state/AppProvider';
export function Label({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.text, muted && styles.muted]}>{children}</Text>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  small = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        small && { paddingHorizontal: 16 },
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: t.colors.ink }]}>{children}</Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: t.colors.ink, borderColor: t.colors.ink },
      ]}
    >
      <Text style={[styles.chipText, selected && { color: t.colors.cream }]}>{label}</Text>
    </Pressable>
  );
}
export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={t.colors.muted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}
export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
export function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}
export function Screen({ children }: { children: React.ReactNode }) {
  const app = useApp();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screen}>
        <View style={styles.brand}>
          <Text style={styles.logo}>
            miamatch<Text style={{ color: t.colors.coral }}> ✳</Text>
          </Text>
          <Text style={styles.eyebrow}>
            {app.mode === 'demo'
              ? 'DÉMO LOCALE'
              : app.mode === 'live'
                ? 'LE GOÛT DU NOUS'
                : 'SWIPE TON PROCHAIN KIFF'}
          </Text>
        </View>
        {app.error && (
          <Panel style={{ backgroundColor: '#FFE1D8' }}>
            <Text accessibilityRole="alert" style={styles.text}>
              {app.error}
            </Text>
            <Button secondary onPress={app.clearError}>
              Fermer
            </Button>
          </Panel>
        )}
        {children}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
export function Loading() {
  return (
    <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.logo}>miamatch ✳</Text>
      <ActivityIndicator color={t.colors.coral} />
    </SafeAreaView>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.colors.cream },
  screen: { padding: 24, gap: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  logo: { fontFamily: t.font.title, fontSize: 28, color: t.colors.ink, letterSpacing: -1.2 },
  eyebrow: {
    fontFamily: t.font.bold,
    fontSize: 9,
    color: t.colors.muted,
    letterSpacing: 1.2,
    maxWidth: 110,
    textAlign: 'right',
  },
  title: {
    fontFamily: t.font.title,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -2,
    color: t.colors.ink,
  },
  heading: {
    fontFamily: t.font.title,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: t.colors.ink,
  },
  text: { fontFamily: t.font.body, fontSize: 15, lineHeight: 23, color: t.colors.ink },
  muted: { color: t.colors.muted },
  button: {
    backgroundColor: t.colors.ink,
    minHeight: 54,
    borderRadius: t.radius.button,
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: '#EFE4D6' },
  buttonText: { color: t.colors.cream, fontFamily: t.font.bold, fontSize: 15, textAlign: 'center' },
  chip: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: t.colors.line,
    borderRadius: 30,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontFamily: t.font.bold, color: t.colors.ink },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: t.colors.line,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: t.font.body,
    color: t.colors.ink,
    backgroundColor: '#FFFDF8',
  },
  panel: { backgroundColor: '#F3EADD', borderRadius: 24, padding: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
});
