import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Header, Hero, Pill, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { planDays, findDay } from '../data/plan';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export function PlanReadyScreen({ navigation }: Props<'PlanReady'>) {
  return <Screen>
    <Header title="Your assessment" onBack={() => navigation.goBack()} />
    <Hero title="Ready to build" subtitle="Preferred training style, progress and goals set as intended." />
    <View style={s.section}>
      <SectionLabel>Training focus</SectionLabel>
      <Text style={s.copy}>Full-body strength with progressive overload at a moderate intensity, three sessions a week.</Text>
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('PlanFirst')}>View recommended plan</Button></View>
  </Screen>;
}

export function PlanFirstScreen({ navigation }: Props<'PlanFirst'>) {
  return <Screen>
    <Header title="Your first plan" onBack={() => navigation.goBack()} />
    <View style={s.pillRow}>
      <Pill label="3 days per week" selected onPress={() => {}} />
      <Pill label="8 weeks" selected={false} onPress={() => {}} />
    </View>
    <Text style={s.schedule}>Mon · Wed · Fri</Text>
    <View style={s.dayList}>
      {planDays.map((day, index) => <Card key={day.id} onPress={() => navigation.navigate('PlanWorkoutPreview', { day: day.id })}>
        <Text style={s.dayTitle}>Day {index + 1} · {day.label}</Text>
        <Text style={s.dayDetail}>{day.exercises.length} exercises · about 45 min</Text>
      </Card>)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('PlanWorkoutPreview', { day: 'A' })}>Continue</Button></View>
  </Screen>;
}

export function PlanWorkoutPreviewScreen({ navigation, route }: Props<'PlanWorkoutPreview'>) {
  const day = findDay(route.params?.day);
  return <Screen>
    <Header title={day.label} onBack={() => navigation.goBack()} />
    <Text style={s.duration}>45 mins</Text>
    <View style={s.exerciseList}>
      {day.exercises.map(exercise => <Card key={exercise.name}>
        <Text style={s.exerciseName}>{exercise.name}</Text>
        <Text style={s.exerciseDetail}>{exercise.sets} x {exercise.reps} · {exercise.rest}</Text>
      </Card>)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('TodayWorkout', { day: day.id })}>Start workout</Button></View>
  </Screen>;
}

const s = StyleSheet.create({
  section: { marginTop: 32, gap: 8 }, copy: { fontSize: 14, lineHeight: 21, color: colors.muted },
  pillRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  schedule: { fontSize: 13, color: colors.muted, marginTop: 12, marginBottom: 20 },
  dayList: { gap: 12 }, dayTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  dayDetail: { fontSize: 13, color: colors.muted },
  duration: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  exerciseList: { gap: 12 }, exerciseName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  exerciseDetail: { fontSize: 13, color: colors.muted },
  continue: { marginTop: 36 },
});
