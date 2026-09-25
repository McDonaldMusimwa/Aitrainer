import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Button, DateField, Header, Hero, Notice, NumberScroller, OptionTile, Pill, ProgressTrack, Row, TextArea, Input, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { createAssessment, upsertProfile } from '../api';
import { getCurrentUserId } from '../session';
import {
  DIET_OPTIONS, EQUIPMENT_OPTIONS, EXPERIENCE_OPTIONS, GOAL_OPTIONS,
  activityLevelForExperience, getDraft, resetDraft, updateDraft,
} from '../onboardingDraft';
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
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  function submit() {
    updateDraft({
      biologicalSex: gender === 'female' ? 'FEMALE' : 'MALE',
      dateOfBirth: dob.trim() || undefined,
      heightCm: height,
      currentWeightKg: weight,
    });
    navigation.navigate('AssessmentGoals');
  }
  return <Screen>
    <WizardHeader title="About you" step={1} onBack={() => navigation.goBack()} />
    <View style={s.form}>
      <DateField value={dob} onChange={setDob} />
      <View style={s.genderRow}>
        <Pill label="Female" selected={gender === 'female'} onPress={() => setGender('female')} />
        <Pill label="Male" selected={gender === 'male'} onPress={() => setGender('male')} />
      </View>
      <NumberScroller label="Height" value={height} onChange={setHeight} min={120} max={220} suffix="cm" />
      <NumberScroller label="Current weight" value={weight} onChange={setWeight} min={30} max={200} suffix="kg" />
    </View>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

const GOALS = ['Lose body fat', 'Build muscle', 'Get stronger', 'Improve fitness'];
export function AssessmentGoalsScreen({ navigation }: Props<'AssessmentGoals'>) {
  const [goal, setGoal] = useState(GOALS[1]);
  function submit() {
    updateDraft({ goalType: GOAL_OPTIONS[goal] });
    navigation.navigate('AssessmentExperience');
  }
  return <Screen>
    <WizardHeader title="Main goal" step={2} onBack={() => navigation.goBack()} />
    <Text style={s.subtitle}>Choose the outcome that matters most right now.</Text>
    <View style={s.grid}>
      {GOALS.map(g => <View key={g} style={s.gridItem}><OptionTile label={g} selected={goal === g} onPress={() => setGoal(g)} /></View>)}
    </View>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

const EXPERIENCE = [
  { label: 'Beginner', sublabel: 'Less than 3 months' },
  { label: 'Intermediate', sublabel: '3 months to 2 years' },
  { label: 'Advanced', sublabel: 'More than 2 years' },
];
export function AssessmentExperienceScreen({ navigation }: Props<'AssessmentExperience'>) {
  const [level, setLevel] = useState(EXPERIENCE[1].label);
  function submit() {
    const trainingExperience = EXPERIENCE_OPTIONS[level];
    updateDraft({ trainingExperience });
    navigation.navigate('AssessmentSchedule');
  }
  return <Screen>
    <WizardHeader title="Training experience" step={3} onBack={() => navigation.goBack()} />
    <View style={s.list}>
      {EXPERIENCE.map(e => <OptionTile key={e.label} label={e.label} sublabel={e.sublabel} selected={level === e.label} onPress={() => setLevel(e.label)} />)}
    </View>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

const DAY_OPTIONS = ['2 days', '3 days', '4 days', '5 days'];
const LENGTH_OPTIONS = ['30 min', '45 min', '60 min'];
export function AssessmentScheduleScreen({ navigation }: Props<'AssessmentSchedule'>) {
  const [days, setDays] = useState(DAY_OPTIONS[1]);
  const [length, setLength] = useState(LENGTH_OPTIONS[1]);
  function submit() {
    updateDraft({
      trainingDaysPerWeek: parseInt(days, 10),
      sessionDurationMinutes: parseInt(length, 10),
    });
    navigation.navigate('AssessmentEquipment');
  }
  return <Screen>
    <WizardHeader title="Your schedule" step={4} onBack={() => navigation.goBack()} />
    <SectionLabel>Training days</SectionLabel>
    <View style={s.pillRow}>{DAY_OPTIONS.map(d => <Pill key={d} label={d} selected={days === d} onPress={() => setDays(d)} />)}</View>
    <View style={s.sectionGap} />
    <SectionLabel>Session length</SectionLabel>
    <View style={s.pillRow}>{LENGTH_OPTIONS.map(l => <Pill key={l} label={l} selected={length === l} onPress={() => setLength(l)} />)}</View>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

const EQUIPMENT = ['Full gym', 'Home gym', 'Dumbbells only', 'Bodyweight only'];
export function AssessmentEquipmentScreen({ navigation }: Props<'AssessmentEquipment'>) {
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  function submit() {
    updateDraft(EQUIPMENT_OPTIONS[equipment]);
    navigation.navigate('AssessmentHealth');
  }
  return <Screen>
    <WizardHeader title="Available equipment" step={5} onBack={() => navigation.goBack()} />
    <View style={s.list}>
      {EQUIPMENT.map(e => <OptionTile key={e} label={e} selected={equipment === e} onPress={() => setEquipment(e)} />)}
    </View>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

export function AssessmentHealthScreen({ navigation }: Props<'AssessmentHealth'>) {
  const [notes, setNotes] = useState('');
  const [nothingToReport, setNothingToReport] = useState(false);
  function submit() {
    updateDraft({ healthDescription: nothingToReport ? '' : notes.trim() });
    navigation.navigate('AssessmentNutrition');
  }
  return <Screen>
    <WizardHeader title="Health and movement" step={6} onBack={() => navigation.goBack()} />
    <Text style={s.subtitle}>Tell us about any injuries, pain, or movement restrictions we should plan around.</Text>
    <TextArea placeholder="Describe..." value={notes} onChangeText={v => { setNotes(v); setNothingToReport(false); }} editable={!nothingToReport} />
    <View style={s.sectionGap} />
    <Button secondary onPress={() => { setNothingToReport(true); setNotes(''); }}>{nothingToReport ? 'Nothing to report ✓' : 'Nothing to report'}</Button>
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
  </Screen>;
}

const DIETS = ['Performance', 'Vegetarian', 'Vegan', 'Low carb'];
export function AssessmentNutritionScreen({ navigation }: Props<'AssessmentNutrition'>) {
  const [diet, setDiet] = useState(DIETS[0]);
  const [avoid, setAvoid] = useState('');
  function submit() {
    updateDraft({
      dietaryPattern: DIET_OPTIONS[diet],
      allergies: avoid.split(',').map(item => item.trim()).filter(Boolean),
    });
    navigation.navigate('AssessmentPhotos');
  }
  return <Screen>
    <WizardHeader title="Nutrition preference" step={7} onBack={() => navigation.goBack()} />
    <View style={s.grid}>
      {DIETS.map(d => <View key={d} style={s.gridItem}><OptionTile label={d} selected={diet === d} onPress={() => setDiet(d)} /></View>)}
    </View>
    <View style={s.sectionGap} />
    <Input placeholder="Allergies or foods to avoid" value={avoid} onChangeText={setAvoid} />
    <View style={s.continue}><Button onPress={submit}>Continue</Button></View>
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

const GOAL_LABELS = Object.fromEntries(Object.entries(GOAL_OPTIONS).map(([label, value]) => [value, label]));
const EXPERIENCE_LABELS = Object.fromEntries(Object.entries(EXPERIENCE_OPTIONS).map(([label, value]) => [value, label]));

export function AssessmentReviewScreen({ navigation }: Props<'AssessmentReview'>) {
  const draft = getDraft();

  const submitAssessment = useMutation({
    mutationFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Please create your account again before continuing.');

      await upsertProfile(userId, {
        firstName: draft.firstName,
        lastName: draft.lastName,
        dateOfBirth: draft.dateOfBirth,
        biologicalSex: draft.biologicalSex,
        heightCm: draft.heightCm,
        currentWeightKg: draft.currentWeightKg,
      });

      return createAssessment(userId, {
        trainingExperience: draft.trainingExperience,
        currentActivityLevel: activityLevelForExperience(draft.trainingExperience),
        goals: [{ type: draft.goalType, priority: 'PRIMARY' }],
        trainingPreference: {
          trainingDaysPerWeek: draft.trainingDaysPerWeek,
          sessionDurationMinutes: draft.sessionDurationMinutes,
          trainingLocation: draft.trainingLocation,
        },
        equipment: draft.equipment.map(equipmentType => ({ equipmentType })),
        healthConstraints: draft.healthDescription
          ? [{ type: 'EXERCISE_RESTRICTION', description: draft.healthDescription }]
          : [],
        nutritionPreference: {
          dietaryPattern: draft.dietaryPattern,
          allergies: draft.allergies.length ? draft.allergies : undefined,
        },
      });
    },
    onSuccess: () => {
      resetDraft();
      navigation.navigate('PlanReady');
    },
  });

  return <Screen>
    <WizardHeader title="Review assessment" step={9} onBack={() => navigation.goBack()} />
    <View style={s.reviewList}>
      <Row label="Goal" value={GOAL_LABELS[draft.goalType]} />
      <Row label="Schedule" value={`${draft.trainingDaysPerWeek}x · ${draft.sessionDurationMinutes} min`} />
      <Row label="Equipment" value={`${draft.equipment.length} item${draft.equipment.length === 1 ? '' : 's'}`} />
      <Row label="Level" value={EXPERIENCE_LABELS[draft.trainingExperience]} />
    </View>
    <View style={s.continue}>
      <Button onPress={() => submitAssessment.mutate()} disabled={submitAssessment.isPending}>
        {submitAssessment.isPending ? 'Generating…' : 'Generate my plan'}
      </Button>
    </View>
    {submitAssessment.isError && <Notice>{submitAssessment.error instanceof Error ? submitAssessment.error.message : 'Could not save your assessment. Please try again.'}</Notice>}
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
