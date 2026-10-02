import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DateField, Header, Input, NumberScroller, Notice, Pill, Row, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { getLatestAssessment, getProfile, listProgressPhotos, upsertProfile } from '../api';
import { getCurrentUserId } from '../session';
import { resetDraft } from '../onboardingDraft';
import {
  ACTIVITY_LEVEL_LABELS, BIOLOGICAL_SEX_LABELS, DIETARY_PATTERN_LABELS, DISTANCE_UNIT_LABELS,
  EQUIPMENT_LABELS, EXPERIENCE_LABELS, GOAL_LABELS, TRAINING_LOCATION_LABELS, WEIGHT_UNIT_LABELS,
} from '../labels';
import type { BiologicalSex, DistanceUnit, UserProfile, UserProfileUpsertInput, WeightUnit } from '../types/domain';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

/** The PUT endpoint overwrites every field, so any partial edit must carry the rest of the saved profile forward. */
function profileToUpsertInput(profile: UserProfile): UserProfileUpsertInput {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth,
    biologicalSex: profile.biologicalSex,
    heightCm: profile.heightCm,
    currentWeightKg: profile.currentWeightKg,
    preferredWeightUnit: profile.preferredWeightUnit,
    preferredDistanceUnit: profile.preferredDistanceUnit,
    timezone: profile.timezone,
    profileImageUrl: profile.profileImageUrl,
  };
}

export function ProfilePersonalDetailsScreen({ navigation }: Props<'ProfilePersonalDetails'>) {
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
    retry: false,
  });

  const [hydrated, setHydrated] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<BiologicalSex>('NOT_SPECIFIED');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);

  useEffect(() => {
    if (profileQuery.data && !hydrated) {
      setFirstName(profileQuery.data.firstName);
      setLastName(profileQuery.data.lastName ?? '');
      setDob(profileQuery.data.dateOfBirth ?? '');
      setSex(profileQuery.data.biologicalSex ?? 'NOT_SPECIFIED');
      setHeight(profileQuery.data.heightCm ?? 170);
      setWeight(profileQuery.data.currentWeightKg ?? 70);
      setHydrated(true);
    }
  }, [profileQuery.data, hydrated]);

  const save = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Please sign in again to update your details.');
      return upsertProfile(userId, {
        ...(profileQuery.data ? profileToUpsertInput(profileQuery.data) : {}),
        firstName: firstName.trim() || 'Member',
        lastName: lastName.trim() || undefined,
        dateOfBirth: dob || undefined,
        biologicalSex: sex,
        heightCm: height,
        currentWeightKg: weight,
      });
    },
    onSuccess: updated => {
      queryClient.setQueryData(['profile', userId], updated);
      navigation.goBack();
    },
  });

  return <Screen>
    <Header title="Personal details" onBack={() => navigation.goBack()} />
    {!userId && <Notice>Please sign in again to view your details.</Notice>}
    {userId && <>
      <View style={s.field}><SectionLabel>First name</SectionLabel><Input value={firstName} onChangeText={setFirstName} placeholder="First name" /></View>
      <View style={s.field}><SectionLabel>Last name</SectionLabel><Input value={lastName} onChangeText={setLastName} placeholder="Last name" /></View>
      <View style={s.field}><SectionLabel>Date of birth</SectionLabel><DateField value={dob} onChange={setDob} /></View>
      <View style={s.field}>
        <SectionLabel>Biological sex</SectionLabel>
        <View style={s.pillRow}>
          {(Object.keys(BIOLOGICAL_SEX_LABELS) as BiologicalSex[]).map(value =>
            <Pill key={value} label={BIOLOGICAL_SEX_LABELS[value]} selected={sex === value} onPress={() => setSex(value)} />
          )}
        </View>
      </View>
      <View style={s.field}><NumberScroller label="Height" value={height} onChange={setHeight} min={120} max={220} suffix="cm" /></View>
      <View style={s.field}><NumberScroller label="Weight" value={weight} onChange={setWeight} min={30} max={200} suffix="kg" /></View>
      <View style={s.continue}>
        <Button onPress={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
      </View>
      {save.isError && <Notice>{save.error instanceof Error ? save.error.message : 'Could not save your details. Please try again.'}</Notice>}
    </>}
  </Screen>;
}

export function ProfileUnitsScreen({ navigation }: Props<'ProfileUnits'>) {
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
    retry: false,
  });

  const [hydrated, setHydrated] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('KG');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('KM');

  useEffect(() => {
    if (profileQuery.data && !hydrated) {
      setWeightUnit(profileQuery.data.preferredWeightUnit);
      setDistanceUnit(profileQuery.data.preferredDistanceUnit);
      setHydrated(true);
    }
  }, [profileQuery.data, hydrated]);

  const save = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Please sign in again to update your preferences.');
      if (!profileQuery.data) throw new Error('Complete your profile first.');
      return upsertProfile(userId, {
        ...profileToUpsertInput(profileQuery.data),
        preferredWeightUnit: weightUnit,
        preferredDistanceUnit: distanceUnit,
      });
    },
    onSuccess: updated => {
      queryClient.setQueryData(['profile', userId], updated);
      navigation.goBack();
    },
  });

  return <Screen>
    <Header title="Units and preferences" onBack={() => navigation.goBack()} />
    {!userId && <Notice>Please sign in again to view your preferences.</Notice>}
    {userId && !profileQuery.isLoading && !profileQuery.data &&
      <Notice>Complete your profile before setting preferences.</Notice>}
    {userId && profileQuery.data && <>
      <View style={s.field}>
        <SectionLabel>Weight</SectionLabel>
        <View style={s.pillRow}>
          {(Object.keys(WEIGHT_UNIT_LABELS) as WeightUnit[]).map(value =>
            <Pill key={value} label={WEIGHT_UNIT_LABELS[value]} selected={weightUnit === value} onPress={() => setWeightUnit(value)} />
          )}
        </View>
      </View>
      <View style={s.field}>
        <SectionLabel>Distance</SectionLabel>
        <View style={s.pillRow}>
          {(Object.keys(DISTANCE_UNIT_LABELS) as DistanceUnit[]).map(value =>
            <Pill key={value} label={DISTANCE_UNIT_LABELS[value]} selected={distanceUnit === value} onPress={() => setDistanceUnit(value)} />
          )}
        </View>
      </View>
      <View style={s.continue}>
        <Button onPress={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
      </View>
      {save.isError && <Notice>{save.error instanceof Error ? save.error.message : 'Could not save your preferences. Please try again.'}</Notice>}
    </>}
  </Screen>;
}

export function ProfileAssessmentAnswersScreen({ navigation }: Props<'ProfileAssessmentAnswers'>) {
  const userId = getCurrentUserId();
  const assessmentQuery = useQuery({
    queryKey: ['latestAssessment', userId],
    queryFn: () => getLatestAssessment(userId as string),
    enabled: !!userId,
    retry: false,
  });
  const assessment = assessmentQuery.data;
  const primaryGoal = assessment?.goals.find(goal => goal.priority === 'PRIMARY') ?? assessment?.goals[0];
  const healthNote = assessment?.healthConstraints[0]?.description;

  return <Screen>
    <Header title="Assessment answers" onBack={() => navigation.goBack()} />
    {!userId && <Notice>Please sign in again to view your assessment.</Notice>}
    {userId && assessmentQuery.isLoading && <Text style={s.loading}>Loading…</Text>}
    {userId && !assessmentQuery.isLoading && !assessment &&
      <Notice>You haven't completed an assessment yet.</Notice>}
    {assessment && <>
      <View style={s.list}>
        <Row label="Goal" value={primaryGoal ? GOAL_LABELS[primaryGoal.type] : '—'} />
        <Row label="Experience" value={EXPERIENCE_LABELS[assessment.trainingExperience]} />
        <Row label="Activity level" value={ACTIVITY_LEVEL_LABELS[assessment.currentActivityLevel]} />
        {assessment.trainingPreference && <>
          <Row label="Schedule" value={`${assessment.trainingPreference.trainingDaysPerWeek}x · ${assessment.trainingPreference.sessionDurationMinutes} min`} />
          <Row label="Location" value={TRAINING_LOCATION_LABELS[assessment.trainingPreference.trainingLocation]} />
        </>}
        <Row label="Equipment" value={assessment.equipment.length ? assessment.equipment.map(item => EQUIPMENT_LABELS[item.equipmentType]).join(', ') : 'None'} />
        <Row label="Nutrition" value={assessment.nutritionPreference ? DIETARY_PATTERN_LABELS[assessment.nutritionPreference.dietaryPattern] : '—'} />
        <Row label="Health notes" value={healthNote ?? 'None reported'} />
      </View>
      <Text style={s.detail}>Version {assessment.version} · {new Date(assessment.createdAt).toLocaleDateString()}</Text>
    </>}
    <View style={s.continue}>
      <Button secondary onPress={() => { resetDraft(); navigation.navigate('AssessmentBasics'); }}>Retake assessment</Button>
    </View>
  </Screen>;
}

export function ProfilePrivacyPhotosScreen({ navigation }: Props<'ProfilePrivacyPhotos'>) {
  const userId = getCurrentUserId();
  const photosQuery = useQuery({
    queryKey: ['progressPhotos', userId],
    queryFn: () => listProgressPhotos(userId as string),
    enabled: !!userId,
    retry: false,
  });
  const photos = photosQuery.data ?? [];

  return <Screen>
    <Header title="Privacy and photos" onBack={() => navigation.goBack()} />
    {!userId && <Notice>Please sign in again to view your photos.</Notice>}
    {userId && <>
      <Text style={s.detail}>Progress photos you've captured, and whether each is available for AI analysis.</Text>
      {photosQuery.isLoading && <Text style={s.loading}>Loading…</Text>}
      {!photosQuery.isLoading && photos.length === 0 &&
        <Notice>No progress photos yet. You'll be able to add some during your next assessment.</Notice>}
      <View style={s.list}>
        {photos.map(photo => <Row
          key={photo.id}
          label={`${photo.view.charAt(0)}${photo.view.slice(1).toLowerCase()} · ${new Date(photo.uploadedAt).toLocaleDateString()}`}
          value={photo.aiAnalysisAllowed ? 'AI analysis on' : 'AI analysis off'}
        />)}
      </View>
    </>}
  </Screen>;
}

const s = StyleSheet.create({
  field: { marginBottom: 20 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  continue: { marginTop: 20 },
  list: { marginTop: 8 },
  detail: { fontSize: 13, color: colors.muted, marginTop: 16 },
  loading: { fontSize: 14, color: colors.muted, marginTop: 24 },
});
