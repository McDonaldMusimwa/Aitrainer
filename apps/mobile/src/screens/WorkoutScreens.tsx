import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Checkline, Header, Hero, Input, NumberScroller, Pill, Screen, SectionLabel, TextArea } from '../components/ui';
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
  const [setWeights, setSetWeights] = useState<number[]>(() => Array(exercise.sets).fill(exercise.targetWeightKg));
  const [activeSet, setActiveSet] = useState(0);

  function toggleSet(index: number) {
    setSetsDone(current => current.map((value, i) => i === index ? !value : value));
  }

  function updateWeight(index: number, value: number) {
    setSetWeights(current => current.map((current_, i) => i === index ? value : current_));
  }

  function save() {
    const done = Array.from(new Set([...(route.params?.done ?? []), exercise.name]));
    navigation.navigate('TodayWorkout', { day: day.id, done });
  }

  return <Screen>
    <Header title={exercise.name} onBack={() => navigation.goBack()} />
    <Text style={s.big}>{exercise.sets} x {exercise.reps}</Text>
    <Text style={s.detail}>Target {exercise.targetWeightKg}kg · Rest {exercise.rest}</Text>
    <View style={s.setList}>
      {setWeights.map((weight, index) => {
        const expanded = activeSet === index;
        return <View key={index} style={s.setBlock}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSet(current => current === index ? -1 : index)}
            style={({ pressed }) => [s.setRow, pressed && s.pressed]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: setsDone[index] }}
              hitSlop={8}
              onPress={() => toggleSet(index)}
              style={[s.checkbox, setsDone[index] && s.checkboxDone]}
            >
              {setsDone[index] ? <Text style={s.checkmark}>✓</Text> : null}
            </Pressable>
            <View style={s.setRowText}>
              <Text style={[s.setLabel, setsDone[index] && s.setLabelDone]}>Set {index + 1}</Text>
              <Text style={s.setDetail}>{weight}kg · {exercise.reps} reps</Text>
            </View>
            <Text style={s.setChevron}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
          {expanded && <View style={s.setScroller}>
            <NumberScroller label={`Set ${index + 1} weight`} value={weight} onChange={value => updateWeight(index, value)} min={0} max={300} suffix="kg" />
          </View>}
        </View>;
      })}
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
  setList: { gap: 0 },
  section: { marginTop: 24 }, pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  adjustCard: { marginTop: 20 },
  setBlock: { borderBottomWidth: 1, borderBottomColor: colors.secondary },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  pressed: { opacity: 0.7 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkmark: { color: colors.background, fontSize: 13, fontWeight: '700' },
  setRowText: { flex: 1, gap: 2 },
  setLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  setLabelDone: { textDecorationLine: 'line-through', opacity: 0.55 },
  setDetail: { fontSize: 13, color: colors.muted },
  setChevron: { fontSize: 11, color: colors.muted },
  setScroller: { paddingBottom: 16 },
});
