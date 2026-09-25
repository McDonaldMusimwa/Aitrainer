import { createElement, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type NativeScrollEvent, type NativeSyntheticEvent, type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

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

export function Button({ children, onPress, secondary = false, disabled = false }: PropsWithChildren<{ onPress: () => void; secondary?: boolean; disabled?: boolean }>) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && styles.pressed]}>
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

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// @react-native-community/datetimepicker ships no web implementation at all
// (confirmed: no web source in the package) and silently renders nothing
// there, so web gets a real <input type="date"> instead — the browser's
// own calendar picker — styled to match Input.
function WebDateField({ value, onChange, placeholder }: { value?: string; onChange: (isoDate: string) => void; placeholder: string }) {
  return createElement('input', {
    type: 'date',
    value: value ?? '',
    max: toIsoDate(new Date()),
    'aria-label': placeholder,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    style: {
      width: '100%', boxSizing: 'border-box', minHeight: 72, borderRadius: 16,
      border: `1px solid ${colors.border}`, paddingLeft: 28, paddingRight: 28,
      fontSize: 16, color: colors.ink, backgroundColor: colors.surface, fontFamily: 'inherit',
    },
  });
}

/** A tappable field that opens the native calendar picker (a real date input on web). */
export function DateField({ value, onChange, placeholder = 'Date of birth' }: { value?: string; onChange: (isoDate: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : new Date(2000, 0, 1);

  if (Platform.OS === 'web') {
    return <View style={styles.field}><WebDateField value={value} onChange={onChange} placeholder={placeholder} /></View>;
  }

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed' || !date) return;
    onChange(toIsoDate(date));
  }

  const label = value ? selected.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder;

  return <View style={styles.field}>
    <Pressable accessibilityRole="button" accessibilityLabel={placeholder} onPress={() => setShow(true)} style={styles.input}>
      <Text style={{ fontSize: 16, color: colors.ink }}>{label}</Text>
    </Pressable>
    {show && <DateTimePicker
      value={selected} mode="date" maximumDate={new Date()}
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      onChange={handleChange}
    />}
    {Platform.OS === 'ios' && show && (
      <Pressable accessibilityRole="button" onPress={() => setShow(false)} style={[styles.button, extra.doneButton]}>
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
    )}
  </View>;
}

const SCROLLER_ITEM_HEIGHT = 44;
const SCROLLER_VISIBLE_ITEMS = 3;

/** A scrollable, snap-to-value number picker — no typing, matches Input's width. */
export function NumberScroller({ value, onChange, min, max, step = 1, suffix, label }: {
  value: number; onChange: (value: number) => void; min: number; max: number; step?: number; suffix?: string; label: string;
}) {
  const listRef = useRef<ScrollView>(null);
  const values = useMemo(() => {
    const list: number[] = [];
    for (let v = min; v <= max; v += step) list.push(Math.round(v * 100) / 100);
    return list;
  }, [min, max, step]);
  const padding = SCROLLER_ITEM_HEIGHT * Math.floor(SCROLLER_VISIBLE_ITEMS / 2);

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const index = values.indexOf(value);
    if (index >= 0) listRef.current?.scrollTo({ y: index * SCROLLER_ITEM_HEIGHT, animated: false });
    return () => { if (settleTimer.current) clearTimeout(settleTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitFromOffset(y: number) {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(y / SCROLLER_ITEM_HEIGHT)));
    if (values[index] !== value) onChange(values[index]);
  }

  // onMomentumScrollEnd/onScrollEndDrag only fire for touch/drag release, never
  // for mouse-wheel or trackpad scrolling on web, so the value would silently
  // never update from wheel input. A debounced onScroll catches every input
  // method the same way: commit once scrolling has actually stopped.
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => commitFromOffset(y), 120);
  }

  function onScrollSettled(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    commitFromOffset(event.nativeEvent.contentOffset.y);
  }

  return <View style={styles.field}>
    <Text style={extra.scrollerLabel}>{label}</Text>
    <View style={[extra.scrollerFrame, { height: SCROLLER_ITEM_HEIGHT * SCROLLER_VISIBLE_ITEMS }]}>
      <View pointerEvents="none" style={[extra.scrollerHighlight, { top: padding, height: SCROLLER_ITEM_HEIGHT }]} />
      <ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={SCROLLER_ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollSettled}
        onScrollEndDrag={onScrollSettled}
        contentContainerStyle={{ paddingVertical: padding }}
      >
        {values.map(v => <View key={v} style={extra.scrollerRow}>
          <Text style={[extra.scrollerValue, v === value && extra.scrollerValueSelected]}>{v}{suffix ? ` ${suffix}` : ''}</Text>
        </View>)}
      </ScrollView>
    </View>
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

export function ProgressTrack({ step, total }: { step: number; total: number }) {
  const pct = Math.max(0, Math.min(1, step / total));
  return <View style={extra.track}><View style={[extra.trackFill, { width: `${pct * 100}%` }]} /></View>;
}

export function Card({ children, onPress }: PropsWithChildren<{ onPress?: () => void }>) {
  const Wrapper = onPress ? Pressable : View;
  return <Wrapper accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }: any) => [extra.card, onPress && pressed && styles.pressed]}>
    {children}
  </Wrapper>;
}

export function OptionTile({ label, sublabel, selected, onPress }: { label: string; sublabel?: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [extra.tile, selected && extra.tileSelected, pressed && styles.pressed]}>
    <Text style={[extra.tileLabel, selected && extra.tileLabelSelected]}>{label}</Text>
    {sublabel ? <Text style={extra.tileSublabel}>{sublabel}</Text> : null}
  </Pressable>;
}

export function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [extra.pill, selected && extra.pillSelected, pressed && styles.pressed]}>
    <Text style={[extra.pillLabel, selected && extra.pillLabelSelected]}>{label}</Text>
  </Pressable>;
}

export function TextArea(props: TextInputProps & { error?: string }) {
  return <Input {...props} multiline numberOfLines={5} textAlignVertical="top" style={[extra.textArea, props.style]} />;
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <Text style={extra.sectionLabel}>{children}</Text>;
}

export function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return <Wrapper accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }: any) => [extra.row, onPress && pressed && styles.pressed]}>
    <Text style={extra.rowLabel}>{label}</Text>
    <View style={extra.rowRight}>
      {value ? <Text style={extra.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={extra.rowChevron}>›</Text> : null}
    </View>
  </Wrapper>;
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return <View style={extra.stat}>
    <Text style={extra.statValue}>{value}</Text>
    <Text style={extra.statLabel}>{label}</Text>
  </View>;
}

export function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return <View style={extra.bars}>
    {data.map(d => <View key={d.label} style={extra.barColumn}>
      <View style={extra.barTrack}><View style={[extra.barFill, { height: `${Math.max(6, (d.value / max) * 100)}%` }]} /></View>
      <Text style={extra.barLabel}>{d.label}</Text>
    </View>)}
  </View>;
}

export function Checkline({ label, detail, checked, onPress }: { label: string; detail?: string; checked: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress}
    style={({ pressed }) => [extra.checkline, checked && extra.checklineDone, pressed && styles.pressed]}>
    <View style={[extra.checkbox, checked && extra.checkboxDone]}>{checked ? <Text style={extra.checkmark}>✓</Text> : null}</View>
    <View style={extra.checklineText}>
      <Text style={[extra.checklineLabel, checked && extra.checklineLabelDone]}>{label}</Text>
      {detail ? <Text style={extra.checklineDetail}>{detail}</Text> : null}
    </View>
  </Pressable>;
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

const extra = StyleSheet.create({
  doneButton: { marginTop: 12 },
  scrollerLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 4 },
  scrollerFrame: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' },
  scrollerHighlight: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.focus, borderRadius: 10, marginHorizontal: 8 },
  scrollerRow: { height: SCROLLER_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  scrollerValue: { fontSize: 16, color: colors.muted },
  scrollerValueSelected: { fontSize: 19, fontWeight: '700', color: colors.ink },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.secondary, overflow: 'hidden', marginTop: -16, marginBottom: 28 },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, gap: 6 },
  tile: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, gap: 4, backgroundColor: colors.surface },
  tileSelected: { borderColor: colors.ink, borderWidth: 2, backgroundColor: colors.focus },
  tileLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  tileLabelSelected: { color: colors.ink },
  tileSublabel: { fontSize: 12, lineHeight: 17, color: colors.muted },
  pill: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  pillLabelSelected: { color: colors.primaryForeground },
  textArea: { minHeight: 140, paddingTop: 18 },
  sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, color: colors.muted, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.secondary },
  rowLabel: { fontSize: 15, color: colors.ink, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: colors.muted },
  rowChevron: { fontSize: 20, color: colors.muted, lineHeight: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 8 },
  barColumn: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6, backgroundColor: colors.accent, minHeight: 6 },
  barLabel: { fontSize: 10, color: colors.muted },
  checkline: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.secondary },
  checklineDone: { opacity: 0.55 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkmark: { color: colors.background, fontSize: 13, fontWeight: '700' },
  checklineText: { flex: 1, gap: 2 },
  checklineLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  checklineLabelDone: { textDecorationLine: 'line-through' },
  checklineDetail: { fontSize: 13, color: colors.muted },
});
