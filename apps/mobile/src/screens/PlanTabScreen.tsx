import { StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Pill, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { planDays } from '../data/plan';
import type { MainTabParamList, RootStackParamList } from '../navigation';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Plan'>, NativeStackScreenProps<RootStackParamList>>;

const EQUIPMENT = ['Barbell', 'Dumbbells', 'Cable machine', 'Bench'];

export default function PlanTabScreen({ navigation }: Props) {
  return <Screen>
    <Text style={s.title}>Plan</Text>
    <View style={s.pillRow}>
      <Pill label="3 days per week" selected onPress={() => {}} />
      <Pill label="Week 2 of 8" selected={false} onPress={() => {}} />
    </View>
    <View style={s.section}>
      <SectionLabel>This week</SectionLabel>
      <View style={s.dayList}>
        {planDays.map((day, index) => {
          const done = index === 0;
          return <Card key={day.id} onPress={() => navigation.navigate('PlanWorkoutPreview', { day: day.id })}>
            <View style={s.dayRow}>
              <View style={[s.dayBadge, done && s.dayBadgeDone]}>
                <Text style={[s.dayBadgeText, done && s.dayBadgeTextDone]}>{done ? '✓' : index + 1}</Text>
              </View>
              <View style={s.dayText}>
                <Text style={s.dayTitle}>Day {index + 1} · {day.label}</Text>
                <Text style={s.dayDetail}>{done ? 'Completed · Monday' : `${day.exercises.length} exercises · about 45 min`}</Text>
              </View>
            </View>
          </Card>;
        })}
      </View>
    </View>
    <View style={s.section}>
      <SectionLabel>Equipment for today</SectionLabel>
      <View style={s.chipRow}>
        {EQUIPMENT.map((item, index) => <View key={item} style={[s.chip, index < 2 && s.chipActive]}>
          <Text style={[s.chipLabel, index < 2 && s.chipLabelActive]}>{item}</Text>
        </View>)}
      </View>
    </View>
    <View style={s.section}>
      <Card onPress={() => navigation.navigate('WorkoutAdjust')}>
        <Text style={s.dayTitle}>Need to adjust today's workout?</Text>
        <Text style={s.dayDetail}>Swap exercises based on equipment, soreness, or time.</Text>
      </Card>
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 24, marginBottom: 16 },
  pillRow: { flexDirection: 'row', gap: 10 },
  section: { marginTop: 28 }, dayList: { gap: 12 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dayBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  dayBadgeDone: { backgroundColor: colors.accent },
  dayBadgeText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  dayBadgeTextDone: { color: colors.accentForeground },
  dayText: { flex: 1 },
  dayTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  dayDetail: { fontSize: 13, color: colors.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipLabelActive: { color: colors.accentForeground, fontWeight: '700' },
});
