import { StyleSheet, Text, View } from 'react-native';
import { Bars, Card, Screen, SectionLabel, StatTile } from '../components/ui';
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
      <StatTile label="Workouts" value="11/12" />
      <StatTile label="Adherence" value="92%" />
      <StatTile label="Weight change" value="-1.5 lbs" />
    </View>
    <View style={s.section}>
      <SectionLabel>Weekly consistency</SectionLabel>
      <Card><Bars data={WEEKLY_ADHERENCE} /></Card>
    </View>
    <View style={s.section}>
      <SectionLabel>Strength trend</SectionLabel>
      <Card>
        <Text style={s.cardTitle}>Bench press</Text>
        <Text style={s.cardDetail}>70 kg → 77.2 kg over 6 weeks</Text>
      </Card>
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
  statRow: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  section: { marginTop: 28 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cardDetail: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
