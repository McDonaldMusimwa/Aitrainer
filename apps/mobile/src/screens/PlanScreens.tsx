import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Header, Hero, Pill, Screen, SectionLabel, StatTile } from '../components/ui';
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
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  return <Screen>
    <Header title={day.label} onBack={() => navigation.goBack()} />
    <Card>
      <View style={s.statsRow}>
        <StatTile label="Duration" value="45 mins" />
        <View style={s.statDivider} />
        <StatTile label="Exercises" value={String(day.exercises.length)} />
        <View style={s.statDivider} />
        <StatTile label="Total sets" value={String(totalSets)} />
      </View>
    </Card>
    <View style={s.section}>
      <SectionLabel>Exercises</SectionLabel>
      <View style={s.exerciseList}>
        {day.exercises.map((exercise, index) => <Card key={exercise.name}>
          <View style={s.exerciseRow}>
            <View style={s.badge}><Text style={s.badgeText}>{index + 1}</Text></View>
            <View style={s.exerciseInfo}>
              <Text style={s.exerciseName}>{exercise.name}</Text>
              <View style={s.exerciseMeta}>
                <Text style={s.exerciseSets}>{exercise.sets} sets × {exercise.reps} reps</Text>
                <Text style={s.exerciseRest}>Rest {exercise.rest}</Text>
              </View>
            </View>
          </View>
        </Card>)}
      </View>
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
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  exerciseList: { gap: 12 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 14, fontWeight: '700', color: colors.accentForeground },
  exerciseInfo: { flex: 1, gap: 4 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  exerciseSets: { fontSize: 13, color: colors.muted },
  exerciseRest: { fontSize: 13, color: colors.muted, opacity: 0.7 },
  continue: { marginTop: 36 },
});
