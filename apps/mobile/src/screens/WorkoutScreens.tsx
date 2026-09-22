import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Checkline, Header, Hero, Input, Pill, Screen, SectionLabel, TextArea } from '../components/ui';
import { colors } from '../theme';
import { findDay } from '../data/plan';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

function useElapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function TodayWorkoutScreen({ navigation, route }: Props<'TodayWorkout'>) {
  const day = findDay(route.params?.day);
  const done = route.params?.done ?? [];
  const elapsed = useElapsed();
  return <Screen>
    <Header title={day.label} onBack={() => navigation.goBack()} />
    <Text style={s.timer}>{elapsed}</Text>
    <View style={s.list}>
      {day.exercises.map(exercise => <Checkline
        key={exercise.name}
        label={exercise.name}
        detail={`${exercise.sets} sets · ${exercise.reps} reps`}
        checked={done.includes(exercise.name)}
        onPress={() => navigation.navigate('ExerciseDetail', { day: day.id, exercise: exercise.name, done })}
      />)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('WorkoutComplete', { day: day.id })}>Finish workout</Button></View>
  </Screen>;
}

export function ExerciseDetailScreen({ navigation, route }: Props<'ExerciseDetail'>) {
  const day = findDay(route.params?.day);
  const exercise = day.exercises.find(e => e.name === route.params?.exercise) ?? day.exercises[0];
  const [setsDone, setSetsDone] = useState<boolean[]>(() => Array(exercise.sets).fill(false));
  const [weight, setWeight] = useState(String(exercise.targetWeightKg));

  function toggleSet(index: number) {
    setSetsDone(current => current.map((value, i) => i === index ? !value : value));
  }

  function save() {
    const done = Array.from(new Set([...(route.params?.done ?? []), exercise.name]));
    navigation.navigate('TodayWorkout', { day: day.id, done });
  }

  return <Screen>
    <Header title={exercise.name} onBack={() => navigation.goBack()} />
    <Text style={s.big}>{exercise.sets} x {exercise.reps}</Text>
    <Text style={s.detail}>Target {weight}kg · Rest {exercise.rest}</Text>
    <View style={s.weightField}><Input placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" /></View>
    <View style={s.setList}>
      {setsDone.map((checked, index) => <Checkline
        key={index}
        label={`Set ${index + 1}`}
        detail={`${weight}kg · ${exercise.reps} reps`}
        checked={checked}
        onPress={() => toggleSet(index)}
      />)}
    </View>
    <View style={s.continue}><Button onPress={save}>Save exercise</Button></View>
  </Screen>;
}

const DIFFICULTY = ['Easy', 'Challenging'];
const SORENESS = ['Not much', 'Very sore'];
export function WorkoutCompleteScreen({ navigation, route }: Props<'WorkoutComplete'>) {
  const day = findDay(route.params?.day);
  const [difficulty, setDifficulty] = useState(DIFFICULTY[0]);
  const [soreness, setSoreness] = useState(SORENESS[0]);
  const [note, setNote] = useState('');
  return <Screen>
    <Hero title="Workout complete" subtitle={`42 minutes · ${day.exercises.length} exercises · 410 cal`} />
    <View style={s.section}>
      <SectionLabel>How did it feel?</SectionLabel>
      <View style={s.pillRow}>{DIFFICULTY.map(d => <Pill key={d} label={d} selected={difficulty === d} onPress={() => setDifficulty(d)} />)}</View>
    </View>
    <View style={s.section}>
      <SectionLabel>Any soreness?</SectionLabel>
      <View style={s.pillRow}>{SORENESS.map(v => <Pill key={v} label={v} selected={soreness === v} onPress={() => setSoreness(v)} />)}</View>
    </View>
    <View style={s.section}>
      <SectionLabel>Optional note</SectionLabel>
      <TextArea placeholder="Anything you want to remember about this session..." value={note} onChangeText={setNote} />
    </View>
    <View style={s.continue}>
      <Button onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>Save workout</Button>
    </View>
  </Screen>;
}

const EQUIPMENT_OPTIONS = ['Dumbbells', 'Barbell'];
export function WorkoutAdjustScreen({ navigation }: Props<'WorkoutAdjust'>) {
  const [equipment, setEquipment] = useState(EQUIPMENT_OPTIONS[0]);
  const [message, setMessage] = useState('');
  return <Screen>
    <Header title="Adjust workout" onBack={() => navigation.goBack()} />
    <Text style={s.detail}>You've completed 3 Full body B sessions this week. How can we help you next?</Text>
    <View style={s.adjustCard}>
      <Card>
        <Text style={s.big}>Suggested alternative</Text>
        <Text style={s.detail}>Using your available equipment. Any pain, discomfort, or exercise you'd like to avoid?</Text>
      </Card>
    </View>
    <View style={s.section}>
      <SectionLabel>Available equipment</SectionLabel>
      <View style={s.pillRow}>{EQUIPMENT_OPTIONS.map(e => <Pill key={e} label={e} selected={equipment === e} onPress={() => setEquipment(e)} />)}</View>
    </View>
    <View style={s.section}>
      <SectionLabel>Message your coach</SectionLabel>
      <Input placeholder="Type a message..." value={message} onChangeText={setMessage} />
    </View>
    <View style={s.continue}><Button onPress={() => { setMessage(''); navigation.goBack(); }}>Send message</Button></View>
  </Screen>;
}

const s = StyleSheet.create({
  timer: { fontSize: 15, fontWeight: '600', color: colors.muted, marginBottom: 20 },
  list: { gap: 0 }, continue: { marginTop: 36 },
  big: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 8 },
  detail: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6, marginBottom: 20 },
  weightField: { marginBottom: 12 }, setList: { gap: 0 },
  section: { marginTop: 24 }, pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  adjustCard: { marginTop: 20 },
});
