import { StyleSheet, Text, View } from 'react-native';
import { Bars, Card, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';

const WEEKLY_ADHERENCE = [
  { label: 'W1', value: 3 },
  { label: 'W2', value: 2 },
  { label: 'W3', value: 3 },
  { label: 'W4', value: 3 },
  { label: 'W5', value: 2 },
  { label: 'W6', value: 3 },
];

export default function ProgressScreen() {
  return <Screen>
    <Text style={s.title}>Progress</Text>
    <Text style={s.subtitle}>Last 30 days</Text>
    <View style={s.statRow}>
      <View style={s.stat}>
        <Text style={s.statValue}>11<Text style={s.statValueMuted}>/12</Text></Text>
        <Text style={s.statLabel}>Workouts</Text>
      </View>
      <View style={s.stat}>
        <Text style={s.statValue}>92%</Text>
        <Text style={s.statLabel}>Adherence</Text>
      </View>
      <View style={[s.stat, s.statDark]}>
        <Text style={s.statValueDark}>-1.5 lbs</Text>
        <Text style={s.statLabelDark}>Weight change</Text>
      </View>
    </View>
    <View style={s.section}>
      <View style={s.sectionHeaderRow}>
        <SectionLabel>Weekly consistency</SectionLabel>
        <Text style={s.trend}>↑ 12%</Text>
      </View>
      <Card><Bars data={WEEKLY_ADHERENCE} /></Card>
    </View>
    <View style={s.section}>
      <SectionLabel>Strength trend</SectionLabel>
      <View style={s.trendList}>
        <Card>
          <View style={s.trendRow}>
            <View>
              <Text style={s.cardTitle}>Bench press</Text>
              <Text style={s.cardDetail}>70 kg → 77.2 kg</Text>
            </View>
            <Text style={s.trendBadge}>+10%</Text>
          </View>
        </Card>
        <Card>
          <View style={s.trendRow}>
            <View>
              <Text style={s.cardTitle}>Back squat</Text>
              <Text style={s.cardDetail}>80 kg → 92 kg</Text>
            </View>
            <Text style={s.trendBadge}>+15%</Text>
          </View>
        </Card>
      </View>
    </View>
    <View style={s.section}>
      <SectionLabel>Progress photos</SectionLabel>
      <Card><Text style={s.cardTitle}>Compare your latest side by side</Text></Card>
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 24 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: 20 },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statDark: { backgroundColor: colors.ink, borderColor: colors.ink },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statValueMuted: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  statValueDark: { fontSize: 18, fontWeight: '700', color: colors.background },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  statLabelDark: { fontSize: 11, color: colors.secondary, fontWeight: '600', marginTop: 2 },
  section: { marginTop: 28 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trend: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  trendList: { gap: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendBadge: { fontSize: 12, fontWeight: '700', color: colors.ink, backgroundColor: colors.secondary, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cardDetail: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
