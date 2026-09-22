import { StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Pill, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { planDays } from '../data/plan';
import type { MainTabParamList, RootStackParamList } from '../navigation';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Plan'>, NativeStackScreenProps<RootStackParamList>>;

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
        {planDays.map((day, index) => <Card key={day.id} onPress={() => navigation.navigate('PlanWorkoutPreview', { day: day.id })}>
          <Text style={s.dayTitle}>Day {index + 1} · {day.label}</Text>
          <Text style={s.dayDetail}>{day.exercises.length} exercises · about 45 min</Text>
        </Card>)}
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
  dayTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  dayDetail: { fontSize: 13, color: colors.muted },
});
