import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Header, Hero, OptionTile, Pill, ProgressTrack, Row, TextArea, Input, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
const TOTAL_STEPS = 9;

function WizardHeader({ title, step, onBack }: { title: string; step: number; onBack: () => void }) {
  return <>
    <Header title={title} onBack={onBack} />
    <ProgressTrack step={step} total={TOTAL_STEPS} />
  </>;
}

export function AssessmentWelcomeScreen({ navigation }: Props<'AssessmentWelcome'>) {
  return <Screen>
    <View style={s.welcomeHero}><Hero title="Let's build your plan" subtitle="The next 5-10 minutes shapes everything we recommend." /></View>
    <View style={s.welcomeBody}>
      <SectionLabel>We will ask about</SectionLabel>
      <Text style={s.welcomeCopy}>Your goals, experience, schedule, equipment, and any health details we should plan around.</Text>
    </View>
    <View style={s.welcomeActions}><Button onPress={() => navigation.navigate('AssessmentBasics')}>Start Assessment</Button></View>
  </Screen>;
}

export function AssessmentBasicsScreen({ navigation }: Props<'AssessmentBasics'>) {
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  return <Screen>
    <WizardHeader title="About you" step={1} onBack={() => navigation.goBack()} />
    <View style={s.form}>
      <Input placeholder="Date of birth" value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" />
      <View style={s.genderRow}>
        <Pill label="Female" selected={gender === 'female'} onPress={() => setGender('female')} />
        <Pill label="Male" selected={gender === 'male'} onPress={() => setGender('male')} />
      </View>
      <Input placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
      <Input placeholder="Current weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentGoals')}>Continue</Button></View>
  </Screen>;
}

const GOALS = ['Lose body fat', 'Build muscle', 'Get stronger', 'Improve fitness'];
export function AssessmentGoalsScreen({ navigation }: Props<'AssessmentGoals'>) {
  const [goal, setGoal] = useState(GOALS[1]);
  return <Screen>
    <WizardHeader title="Main goal" step={2} onBack={() => navigation.goBack()} />
    <Text style={s.subtitle}>Choose the outcome that matters most right now.</Text>
    <View style={s.grid}>
      {GOALS.map(g => <View key={g} style={s.gridItem}><OptionTile label={g} selected={goal === g} onPress={() => setGoal(g)} /></View>)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentExperience')}>Continue</Button></View>
  </Screen>;
}

const EXPERIENCE = [
  { label: 'Beginner', sublabel: 'Less than 3 months' },
  { label: 'Intermediate', sublabel: '3 months to 2 years' },
  { label: 'Advanced', sublabel: 'More than 2 years' },
];
export function AssessmentExperienceScreen({ navigation }: Props<'AssessmentExperience'>) {
  const [level, setLevel] = useState(EXPERIENCE[1].label);
  return <Screen>
    <WizardHeader title="Training experience" step={3} onBack={() => navigation.goBack()} />
    <View style={s.list}>
      {EXPERIENCE.map(e => <OptionTile key={e.label} label={e.label} sublabel={e.sublabel} selected={level === e.label} onPress={() => setLevel(e.label)} />)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentSchedule')}>Continue</Button></View>
  </Screen>;
}

const DAY_OPTIONS = ['2 days', '3 days', '4 days', '5 days'];
const LENGTH_OPTIONS = ['30 min', '45 min', '60 min'];
export function AssessmentScheduleScreen({ navigation }: Props<'AssessmentSchedule'>) {
  const [days, setDays] = useState(DAY_OPTIONS[1]);
  const [length, setLength] = useState(LENGTH_OPTIONS[1]);
  return <Screen>
    <WizardHeader title="Your schedule" step={4} onBack={() => navigation.goBack()} />
    <SectionLabel>Training days</SectionLabel>
    <View style={s.pillRow}>{DAY_OPTIONS.map(d => <Pill key={d} label={d} selected={days === d} onPress={() => setDays(d)} />)}</View>
    <View style={s.sectionGap} />
    <SectionLabel>Session length</SectionLabel>
    <View style={s.pillRow}>{LENGTH_OPTIONS.map(l => <Pill key={l} label={l} selected={length === l} onPress={() => setLength(l)} />)}</View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentEquipment')}>Continue</Button></View>
  </Screen>;
}

const EQUIPMENT = ['Full gym', 'Home gym', 'Dumbbells only', 'Bodyweight only'];
export function AssessmentEquipmentScreen({ navigation }: Props<'AssessmentEquipment'>) {
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  return <Screen>
    <WizardHeader title="Available equipment" step={5} onBack={() => navigation.goBack()} />
    <View style={s.list}>
      {EQUIPMENT.map(e => <OptionTile key={e} label={e} selected={equipment === e} onPress={() => setEquipment(e)} />)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentHealth')}>Continue</Button></View>
  </Screen>;
}

export function AssessmentHealthScreen({ navigation }: Props<'AssessmentHealth'>) {
  const [notes, setNotes] = useState('');
  const [nothingToReport, setNothingToReport] = useState(false);
  return <Screen>
    <WizardHeader title="Health and movement" step={6} onBack={() => navigation.goBack()} />
    <Text style={s.subtitle}>Tell us about any injuries, pain, or movement restrictions we should plan around.</Text>
    <TextArea placeholder="Describe..." value={notes} onChangeText={v => { setNotes(v); setNothingToReport(false); }} editable={!nothingToReport} />
    <View style={s.sectionGap} />
    <Button secondary onPress={() => { setNothingToReport(true); setNotes(''); }}>{nothingToReport ? 'Nothing to report ✓' : 'Nothing to report'}</Button>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentNutrition')}>Continue</Button></View>
  </Screen>;
}

const DIETS = ['Performance', 'Vegetarian', 'Vegan', 'Low carb'];
export function AssessmentNutritionScreen({ navigation }: Props<'AssessmentNutrition'>) {
  const [diet, setDiet] = useState(DIETS[0]);
  const [avoid, setAvoid] = useState('');
  return <Screen>
    <WizardHeader title="Nutrition preference" step={7} onBack={() => navigation.goBack()} />
    <View style={s.grid}>
      {DIETS.map(d => <View key={d} style={s.gridItem}><OptionTile label={d} selected={diet === d} onPress={() => setDiet(d)} /></View>)}
    </View>
    <View style={s.sectionGap} />
    <Input placeholder="Allergies or foods to avoid" value={avoid} onChangeText={setAvoid} />
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentPhotos')}>Continue</Button></View>
  </Screen>;
}

const ANGLES = ['Front', 'Back', 'Side', 'Skip'];
export function AssessmentPhotosScreen({ navigation }: Props<'AssessmentPhotos'>) {
  const [taken, setTaken] = useState<string[]>([]);
  function toggle(angle: string) {
    if (angle === 'Skip') { setTaken(['Skip']); return; }
    setTaken(current => current.includes(angle) ? current.filter(a => a !== angle) : [...current.filter(a => a !== 'Skip'), angle]);
  }
  return <Screen>
    <WizardHeader title="Progress photos" step={8} onBack={() => navigation.goBack()} />
    <Text style={s.subtitle}>Optional, for tracking your transformation over time.</Text>
    <View style={s.grid}>
      {ANGLES.map(a => <View key={a} style={s.gridItem}><OptionTile label={a} selected={taken.includes(a)} onPress={() => toggle(a)} /></View>)}
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('AssessmentReview')}>Continue</Button></View>
  </Screen>;
}

export function AssessmentReviewScreen({ navigation }: Props<'AssessmentReview'>) {
  return <Screen>
    <WizardHeader title="Review assessment" step={9} onBack={() => navigation.goBack()} />
    <View style={s.reviewList}>
      <Row label="Goal" value="Build muscle" />
      <Row label="Schedule" value="3 x 45 min" />
      <Row label="Equipment" value="Full gym" />
      <Row label="Level" value="Intermediate" />
    </View>
    <View style={s.continue}><Button onPress={() => navigation.navigate('PlanReady')}>Generate my plan</Button></View>
  </Screen>;
}

const s = StyleSheet.create({
  welcomeHero: { marginTop: 60 }, welcomeBody: { marginTop: 40, gap: 10 },
  welcomeCopy: { fontSize: 15, lineHeight: 22, color: colors.muted },
  welcomeActions: { marginTop: 56 },
  form: { gap: 20 }, genderRow: { flexDirection: 'row', gap: 12 },
  subtitle: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, gridItem: { width: '47%' },
  list: { gap: 12 }, pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, sectionGap: { height: 24 },
  continue: { marginTop: 36 }, reviewList: { marginTop: 4 },
});
