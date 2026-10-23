import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkline, DateField, Input, Notice, NumberScroller, Pill, Screen } from '../components/ui';
import { Icon, type IconName } from '../components/icons';
import { onPhoto, useStyles, useTheme, type AppColors } from '../theme';
import { createAssessment, upsertProfile } from '../api';
import { getCurrentUserId } from '../session';
import {
  DIET_OPTIONS, EQUIPMENT_OPTIONS, EXPERIENCE_OPTIONS, GOAL_OPTIONS,
  activityLevelForExperience, describeHealth, getDraft, resetDraft, updateDraft,
} from '../onboardingDraft';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
const TOTAL_STEPS = 9;
const introImage = require('../assets/imgs/intropic.png');

// Reverse lookups so each step reopens on the answer already in the draft (e.g. after Edit on Review).
const labelFor = <T,>(options: Record<string, T>, value: T) => Object.keys(options).find(key => options[key] === value);
const equipmentLabel = () => {
  const { trainingLocation, equipment } = getDraft();
  return Object.keys(EQUIPMENT_OPTIONS).find(key => {
    const option = EQUIPMENT_OPTIONS[key];
    return option.trainingLocation === trainingLocation && option.equipment.join() === equipment.join();
  });
};

/* ---------- Building blocks shared by the steps ---------- */

/** Back button, "Step n of 9" and a segmented progress bar. */
function StepHeader({ step, onBack, photo = false }: { step: number; onBack: () => void; photo?: boolean }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const ink = photo ? onPhoto.text : colors.ink;
  return <View style={s.stepHeader}>
    <View style={s.stepTopRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={8} style={s.backTarget}>
        <View style={[s.backCircle, { borderColor: ink }]}><Text style={[s.backArrow, { color: ink }]}>←</Text></View>
      </Pressable>
      <Text style={[s.stepCount, photo && { color: onPhoto.muted }]}>Step {step} of {TOTAL_STEPS}</Text>
    </View>
    <View style={s.segments} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: step }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) =>
        <View key={i} style={[s.segment, { backgroundColor: i < step ? (photo ? onPhoto.accent : colors.accent) : photo ? onPhoto.track : colors.border }]} />)}
    </View>
  </View>;
}

/** The step's question as a big bold title, with a small label above it. */
function StepTitle({ eyebrow, title, subtitle, photo = false }: { eyebrow: string; title: string; subtitle?: string; photo?: boolean }) {
  const s = useStyles(makeStyles);
  return <View style={s.titleBlock}>
    <Text style={[s.eyebrow, photo && { color: onPhoto.accent }]}>{eyebrow}</Text>
    <Text accessibilityRole="header" style={[s.title, photo && { color: onPhoto.text }]}>{title}</Text>
    {subtitle ? <Text style={[s.subtitle, photo && { color: onPhoto.muted }]}>{subtitle}</Text> : null}
  </View>;
}

/** A grid card with an icon; the selected one inverts to the primary colour. */
function ChoiceCard({ icon, label, description, selected, onPress }: { icon: IconName; label: string; description?: string; selected: boolean; onPress: () => void }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" aria-checked={selected} onPress={onPress}
    style={({ pressed }) => [s.choiceCard, selected && s.choiceCardSelected, pressed && s.pressed]}>
    <View style={[s.iconWrap, selected && s.iconWrapSelected]}><Icon name={icon} color={selected ? colors.primaryForeground : colors.accent} /></View>
    <Text style={[s.choiceLabel, selected && s.onPrimary]}>{label}</Text>
    {description ? <Text style={[s.choiceDescription, selected && s.onPrimaryMuted]}>{description}</Text> : null}
  </Pressable>;
}

/** 1–3 ascending bars, filled up to `level`. */
function LevelBars({ level, size = 'large' }: { level: number; size?: 'large' | 'small' }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const heights = size === 'large' ? [10, 18, 26] : [8, 14, 20];
  return <View style={[s.levelBars, { height: heights[2] }]}>
    {heights.map((height, i) => <View key={height} style={[s.levelBar, size === 'small' && s.levelBarSmall, { height, backgroundColor: i < level ? colors.accent : colors.border }]} />)}
  </View>;
}

/** Wraps a step's two-column grid of cards. */
function CardGrid({ children }: { children: ReactNode[] }) {
  const s = useStyles(makeStyles);
  return <View style={s.grid}>{children.map((child, i) => <View key={i} style={s.gridItem}>{child}</View>)}</View>;
}

/* ---------- The steps ---------- */

export function AssessmentWelcomeScreen({ navigation }: Props<'AssessmentWelcome'>) {
  const s = useStyles(makeStyles);
  return <Screen background={introImage}
    footer={<Button onPhoto onPress={() => navigation.navigate('AssessmentBasics')}>Start Assessment</Button>}>
    <View style={s.push} />
    <StepTitle photo eyebrow="ASSESSMENT" title="Let's build your plan" subtitle="The next 5-10 minutes shapes everything we recommend." />
    <Text style={s.welcomeCopy}>We will ask about your goals, experience, schedule, equipment, and any health details we should plan around.</Text>
  </Screen>;
}

export function AssessmentBasicsScreen({ navigation }: Props<'AssessmentBasics'>) {
  const s = useStyles(makeStyles);
  const draft = getDraft();
  const [gender, setGender] = useState<'female' | 'male'>(draft.biologicalSex === 'MALE' ? 'male' : 'female');
  const [dob, setDob] = useState(draft.dateOfBirth ?? '');
  const [height, setHeight] = useState(draft.heightCm ?? 170);
  const [weight, setWeight] = useState(draft.currentWeightKg ?? 70);
  function submit() {
    updateDraft({
      biologicalSex: gender === 'female' ? 'FEMALE' : 'MALE',
      dateOfBirth: dob.trim() || undefined,
      heightCm: height,
      currentWeightKg: weight,
    });
    navigation.navigate('AssessmentGoals');
  }
  return <Screen background={introImage} scrim="full" footer={<Button onPhoto onPress={submit}>Continue</Button>}>
    <StepHeader photo step={1} onBack={() => navigation.goBack()} />
    <StepTitle photo eyebrow="ABOUT YOU" title="Tell us about you" subtitle="Used to size your plan and track progress." />
    <View style={s.form}>
      <DateField value={dob} onChange={setDob} />
      <View style={s.row}>
        <View style={s.flex}><Pill label="Female" selected={gender === 'female'} onPress={() => setGender('female')} /></View>
        <View style={s.flex}><Pill label="Male" selected={gender === 'male'} onPress={() => setGender('male')} /></View>
      </View>
      <NumberScroller onPhoto label="Height" value={height} onChange={setHeight} min={120} max={220} suffix="cm" />
      <NumberScroller onPhoto label="Current weight" value={weight} onChange={setWeight} min={30} max={200} suffix="kg" />
    </View>
  </Screen>;
}

const GOALS: { label: string; description: string; icon: IconName }[] = [
  { label: 'Lose body fat', description: 'Burn fat, keep muscle', icon: 'flame' },
  { label: 'Build muscle', description: 'Add size and shape', icon: 'dumbbell' },
  { label: 'Get stronger', description: 'Lift heavier over time', icon: 'barsUp' },
  { label: 'Improve fitness', description: 'Stamina and energy', icon: 'pulse' },
];
export function AssessmentGoalsScreen({ navigation }: Props<'AssessmentGoals'>) {
  const [goal, setGoal] = useState(labelFor(GOAL_OPTIONS, getDraft().goalType) ?? GOALS[1].label);
  function submit() {
    updateDraft({ goalType: GOAL_OPTIONS[goal] });
    navigation.navigate('AssessmentExperience');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={2} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="MAIN GOAL" title="What's your main goal?" subtitle="Choose the outcome that matters most right now." />
    <CardGrid>
      {GOALS.map(g => <ChoiceCard key={g.label} icon={g.icon} label={g.label} description={g.description} selected={goal === g.label} onPress={() => setGoal(g.label)} />)}
    </CardGrid>
  </Screen>;
}

const EXPERIENCE = [
  { label: 'Beginner', sublabel: 'Less than 3 months', means: 'We start with technique and simple progressions.', level: 1 },
  { label: 'Intermediate', sublabel: '3 months to 2 years', means: 'Structured progression with more volume.', level: 2 },
  { label: 'Advanced', sublabel: 'More than 2 years', means: 'Higher intensity and periodised blocks.', level: 3 },
];
export function AssessmentExperienceScreen({ navigation }: Props<'AssessmentExperience'>) {
  const s = useStyles(makeStyles);
  const [level, setLevel] = useState(labelFor(EXPERIENCE_OPTIONS, getDraft().trainingExperience) ?? EXPERIENCE[1].label);
  function submit() {
    const trainingExperience = EXPERIENCE_OPTIONS[level];
    updateDraft({ trainingExperience });
    navigation.navigate('AssessmentSchedule');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={3} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="EXPERIENCE" title="How long have you been training?" />
    <View style={s.list}>
      {EXPERIENCE.map(e => {
        const selected = level === e.label;
        return <Pressable key={e.label} accessibilityRole="radio" aria-checked={selected} onPress={() => setLevel(e.label)}
          style={({ pressed }) => [s.levelCard, selected && s.levelCardSelected, pressed && s.pressed]}>
          <LevelBars level={e.level} />
          <View style={s.flex}>
            <Text style={s.levelLabel}>{e.label}</Text>
            <Text style={s.levelText}>{e.sublabel}</Text>
            <Text style={s.levelText}>{e.means}</Text>
          </View>
          <View style={[s.radio, selected && s.radioSelected]}>{selected && <View style={s.radioDot} />}</View>
        </Pressable>;
      })}
    </View>
  </Screen>;
}

const MIN_DAYS = 2, MAX_DAYS = 5;
const LENGTHS = [30, 45, 60];
export function AssessmentScheduleScreen({ navigation }: Props<'AssessmentSchedule'>) {
  const s = useStyles(makeStyles);
  const draft = getDraft();
  const [days, setDays] = useState(draft.trainingDaysPerWeek);
  const [length, setLength] = useState(draft.sessionDurationMinutes);
  const total = days * length;
  const weekly = `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ''}`;
  function submit() {
    updateDraft({ trainingDaysPerWeek: days, sessionDurationMinutes: length });
    navigation.navigate('AssessmentEquipment');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={4} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="SCHEDULE" title="How often can you train?" />
    <View style={s.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fewer days" disabled={days <= MIN_DAYS} onPress={() => setDays(d => Math.max(MIN_DAYS, d - 1))}
        style={({ pressed }) => [s.stepperButton, (pressed || days <= MIN_DAYS) && s.pressed]}>
        <Text style={s.stepperSign}>−</Text>
      </Pressable>
      <View style={s.stepperValue} accessibilityLiveRegion="polite">
        <Text style={s.stepperNumber}>{days}</Text>
        <Text style={s.stepperUnit}>days a week</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="More days" disabled={days >= MAX_DAYS} onPress={() => setDays(d => Math.min(MAX_DAYS, d + 1))}
        style={({ pressed }) => [s.stepperButton, (pressed || days >= MAX_DAYS) && s.pressed]}>
        <Text style={s.stepperSign}>+</Text>
      </Pressable>
    </View>
    <Text style={s.sectionLabel}>Session length</Text>
    <View style={s.segmented} accessibilityRole="radiogroup">
      {LENGTHS.map(minutes => {
        const selected = length === minutes;
        return <Pressable key={minutes} accessibilityRole="radio" aria-checked={selected} onPress={() => setLength(minutes)}
          style={[s.segmentOption, selected && s.segmentOptionSelected]}>
          <Text style={[s.segmentText, selected && s.onPrimary]}>{minutes} min</Text>
        </Pressable>;
      })}
    </View>
    <View style={s.summary}>
      <Text style={s.summaryLabel}>That's about</Text>
      <Text style={s.summaryValue}>{weekly} of training a week</Text>
    </View>
  </Screen>;
}

const EQUIPMENT: { label: string; description: string; icon: IconName }[] = [
  { label: 'Full gym', description: 'Machines, barbells, cables', icon: 'building' },
  { label: 'Home gym', description: 'Dumbbells, bench, bands', icon: 'home' },
  { label: 'Dumbbells only', description: 'A pair or a set', icon: 'dumbbell' },
  { label: 'Bodyweight only', description: 'No equipment needed', icon: 'person' },
];
export function AssessmentEquipmentScreen({ navigation }: Props<'AssessmentEquipment'>) {
  const [equipment, setEquipment] = useState(equipmentLabel() ?? EQUIPMENT[0].label);
  function submit() {
    updateDraft(EQUIPMENT_OPTIONS[equipment]);
    navigation.navigate('AssessmentHealth');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={5} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="EQUIPMENT" title="Where will you train?" subtitle="We'll only pick exercises you can do with what you have." />
    <CardGrid>
      {EQUIPMENT.map(e => <ChoiceCard key={e.label} icon={e.icon} label={e.label} description={e.description} selected={equipment === e.label} onPress={() => setEquipment(e.label)} />)}
    </CardGrid>
  </Screen>;
}

const BODY_AREAS = ['Knee', 'Lower back', 'Shoulder', 'Hip', 'Wrist', 'Neck', 'Ankle', 'Elbow'];
export function AssessmentHealthScreen({ navigation }: Props<'AssessmentHealth'>) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const draft = getDraft();
  const [areas, setAreas] = useState<string[]>(draft.healthAreas);
  const [notes, setNotes] = useState(draft.healthNotes);
  const [nothingToReport, setNothingToReport] = useState(false);
  function toggleArea(area: string) {
    setNothingToReport(false);
    setAreas(current => current.includes(area) ? current.filter(a => a !== area) : [...current, area]);
  }
  function toggleNothing() {
    setNothingToReport(!nothingToReport);
    if (!nothingToReport) { setAreas([]); setNotes(''); }
  }
  function submit() {
    const keptAreas = nothingToReport ? [] : areas;
    const keptNotes = nothingToReport ? '' : notes.trim();
    updateDraft({ healthAreas: keptAreas, healthNotes: keptNotes, healthDescription: describeHealth(keptAreas, keptNotes) });
    navigation.navigate('AssessmentNutrition');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={6} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="HEALTH AND MOVEMENT" title="Anything we should plan around?" subtitle="Tap any areas with injuries, pain or limited movement." />
    <View style={s.chips} accessibilityRole="list">
      {BODY_AREAS.map(area => <Pill key={area} label={area} selected={areas.includes(area)} onPress={() => toggleArea(area)} />)}
    </View>
    <Text style={s.sectionLabel}>Anything else? (optional)</Text>
    <TextInput value={notes} onChangeText={v => { setNotes(v); setNothingToReport(false); }} editable={!nothingToReport}
      accessibilityLabel="Anything else about injuries or movement" placeholder="e.g. old knee injury, avoid jumping" placeholderTextColor={colors.muted}
      multiline numberOfLines={3} textAlignVertical="top" style={s.notes} />
    <View style={s.nothing}>
      <Checkline label="Nothing to report" checked={nothingToReport} onPress={toggleNothing} />
    </View>
  </Screen>;
}

const DIETS: { label: string; description: string; icon: IconName }[] = [
  { label: 'Performance', description: 'No restrictions', icon: 'bolt' },
  { label: 'Vegetarian', description: 'No meat or fish', icon: 'leaf' },
  { label: 'Vegan', description: 'Plant-based only', icon: 'sprout' },
  { label: 'Low carb', description: 'Fewer starches and sugar', icon: 'grain' },
];
export function AssessmentNutritionScreen({ navigation }: Props<'AssessmentNutrition'>) {
  const s = useStyles(makeStyles);
  const draft = getDraft();
  const [diet, setDiet] = useState(labelFor(DIET_OPTIONS, draft.dietaryPattern) ?? DIETS[0].label);
  const [avoid, setAvoid] = useState(draft.allergies.join(', '));
  function submit() {
    updateDraft({
      dietaryPattern: DIET_OPTIONS[diet],
      allergies: avoid.split(',').map(item => item.trim()).filter(Boolean),
    });
    navigation.navigate('AssessmentPhotos');
  }
  return <Screen footer={<Button onPress={submit}>Continue</Button>}>
    <StepHeader step={7} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="NUTRITION" title="How do you like to eat?" />
    <CardGrid>
      {DIETS.map(d => <ChoiceCard key={d.label} icon={d.icon} label={d.label} description={d.description} selected={diet === d.label} onPress={() => setDiet(d.label)} />)}
    </CardGrid>
    <View style={s.sectionGap} />
    <Input placeholder="Allergies or foods to avoid" value={avoid} onChangeText={setAvoid} />
  </Screen>;
}

const ANGLES: { label: string; description: string; icon: IconName }[] = [
  { label: 'Front', description: 'Facing the camera', icon: 'camera' },
  { label: 'Back', description: 'Facing away', icon: 'camera' },
  { label: 'Side', description: 'Side-on profile', icon: 'camera' },
  { label: 'Skip', description: 'Maybe later', icon: 'skip' },
];
export function AssessmentPhotosScreen({ navigation }: Props<'AssessmentPhotos'>) {
  const [taken, setTaken] = useState<string[]>([]);
  function toggle(angle: string) {
    if (angle === 'Skip') { setTaken(['Skip']); return; }
    setTaken(current => current.includes(angle) ? current.filter(a => a !== angle) : [...current.filter(a => a !== 'Skip'), angle]);
  }
  return <Screen footer={<Button onPress={() => navigation.navigate('AssessmentReview')}>Continue</Button>}>
    <StepHeader step={8} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="PROGRESS PHOTOS" title="Track your transformation" subtitle="Optional. Pick the angles you'd like to capture." />
    <CardGrid>
      {ANGLES.map(a => <ChoiceCard key={a.label} icon={a.icon} label={a.label} description={a.description} selected={taken.includes(a.label)} onPress={() => toggle(a.label)} />)}
    </CardGrid>
  </Screen>;
}

const GOAL_LABELS = Object.fromEntries(Object.entries(GOAL_OPTIONS).map(([label, value]) => [value, label]));
const EXPERIENCE_LABELS = Object.fromEntries(Object.entries(EXPERIENCE_OPTIONS).map(([label, value]) => [value, label]));

/** One answer on the Review screen: icon, label, value and an Edit link back to its step. */
function ReviewRow({ icon, level, label, value, onEdit, last = false }: {
  icon?: IconName; level?: number; label: string; value: string; onEdit: () => void; last?: boolean;
}) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return <View style={[s.reviewRow, !last && s.reviewDivider]}>
    <View style={s.reviewIcon}>{icon ? <Icon name={icon} color={colors.accent} size={20} /> : <LevelBars level={level ?? 0} size="small" />}</View>
    <View style={s.flex}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue} numberOfLines={2}>{value}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`} onPress={onEdit} hitSlop={8} style={s.editButton}>
      <Text style={s.editText}>Edit</Text>
    </Pressable>
  </View>;
}

export function AssessmentReviewScreen({ navigation }: Props<'AssessmentReview'>) {
  const s = useStyles(makeStyles);
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

  const goal = GOALS.find(g => g.label === GOAL_LABELS[draft.goalType]);
  const level = EXPERIENCE.find(e => e.label === EXPERIENCE_LABELS[draft.trainingExperience]);
  const health = draft.healthAreas.length
    ? draft.healthAreas.join(', ') + (draft.healthNotes ? ' + notes' : '')
    : draft.healthNotes || 'Nothing to report';
  const body = [draft.heightCm && `${draft.heightCm} cm`, draft.currentWeightKg && `${draft.currentWeightKg} kg`].filter(Boolean).join(' · ');
  const diet = labelFor(DIET_OPTIONS, draft.dietaryPattern) ?? 'Performance';

  return <Screen footer={<Button onPress={() => submitAssessment.mutate()} disabled={submitAssessment.isPending}>
    {submitAssessment.isPending ? 'Generating…' : 'Generate my plan'}
  </Button>}>
    <StepHeader step={9} onBack={() => navigation.goBack()} />
    <StepTitle eyebrow="REVIEW" title="Ready to build your plan?" />
    <View style={s.reviewCard}>
      <ReviewRow icon="person" label="About you" value={body || 'Not answered'} onEdit={() => navigation.popTo('AssessmentBasics')} />
      <ReviewRow icon={goal?.icon ?? 'dumbbell'} label="Goal" value={goal?.label ?? '—'} onEdit={() => navigation.popTo('AssessmentGoals')} />
      <ReviewRow level={level?.level} label="Level" value={level?.label ?? '—'} onEdit={() => navigation.popTo('AssessmentExperience')} />
      <ReviewRow icon="calendar" label="Schedule" value={`${draft.trainingDaysPerWeek} days · ${draft.sessionDurationMinutes} min`} onEdit={() => navigation.popTo('AssessmentSchedule')} />
      <ReviewRow icon="kettlebell" label="Equipment" value={equipmentLabel() ?? `${draft.equipment.length} items`} onEdit={() => navigation.popTo('AssessmentEquipment')} />
      <ReviewRow icon="shield" label="Health" value={health} onEdit={() => navigation.popTo('AssessmentHealth')} />
      <ReviewRow last icon="leaf" label="Nutrition" value={draft.allergies.length ? `${diet} · avoids ${draft.allergies.join(', ')}` : diet} onEdit={() => navigation.popTo('AssessmentNutrition')} />
    </View>
    {submitAssessment.isError && <Notice>{submitAssessment.error instanceof Error ? submitAssessment.error.message : 'Could not save your assessment. Please try again.'}</Notice>}
  </Screen>;
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1 }, row: { flexDirection: 'row', gap: 12 }, pressed: { opacity: 0.7 },
  push: { flexGrow: 1, minHeight: 24 },

  stepHeader: { marginTop: 16, marginBottom: 24, gap: 12 },
  stepTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  backCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, lineHeight: 24 },
  stepCount: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },

  titleBlock: { gap: 8, marginBottom: 24 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: colors.accent },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.7, color: colors.ink },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.muted },
  welcomeCopy: { fontSize: 15, lineHeight: 22, color: onPhoto.muted, marginBottom: 8 },

  form: { gap: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, gridItem: { width: '47.5%', flexGrow: 1 },
  list: { gap: 12 },

  choiceCard: { minHeight: 150, borderRadius: 18, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  choiceCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary, marginBottom: 8 },
  iconWrapSelected: { backgroundColor: `${colors.primaryForeground}1F` },
  choiceLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  choiceDescription: { fontSize: 12, lineHeight: 16, color: colors.muted },
  onPrimary: { color: colors.primaryForeground }, onPrimaryMuted: { color: colors.primaryForeground, opacity: 0.75 },

  levelCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  levelCardSelected: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.secondary, padding: 15 },
  levelBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  levelBar: { width: 6, borderRadius: 2 }, levelBarSmall: { width: 5 },
  levelLabel: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  levelText: { fontSize: 13, lineHeight: 18, color: colors.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.ink }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 24 },
  stepperButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  stepperSign: { fontSize: 24, lineHeight: 28, fontWeight: '600', color: colors.ink },
  stepperValue: { alignItems: 'center' },
  stepperNumber: { fontSize: 52, lineHeight: 58, fontWeight: '800', letterSpacing: -1.5, color: colors.ink },
  stepperUnit: { fontSize: 13, fontWeight: '600', color: colors.muted },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted, marginBottom: 8 },
  segmented: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.secondary },
  segmentOption: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentOptionSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  summary: { marginTop: 24, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.secondary, gap: 2 },
  summaryLabel: { fontSize: 13, color: colors.muted },
  summaryValue: { fontSize: 18, fontWeight: '800', color: colors.ink },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  notes: { minHeight: 96, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 15, color: colors.ink },
  nothing: { marginTop: 12 },
  sectionGap: { height: 20 },

  reviewCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 2 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  reviewValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
  editButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  editText: { fontSize: 14, fontWeight: '700', color: colors.accent },
});
