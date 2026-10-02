import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Button, Header, Row, Screen } from '../components/ui';
import { colors } from '../theme';
import { getLatestAssessment, getProfile, getUser } from '../api';
import { getCurrentUserId } from '../session';
import { EXPERIENCE_LABELS, GOAL_LABELS } from '../labels';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function memberSince(createdAt?: string) {
  if (!createdAt) return '—';
  const weeks = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)));
  return `${weeks}wk`;
}

export default function ProfileScreen({ navigation }: Props) {
  const userId = getCurrentUserId();
  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: () => getUser(userId as string), enabled: !!userId, retry: false });
  const profileQuery = useQuery({ queryKey: ['profile', userId], queryFn: () => getProfile(userId as string), enabled: !!userId, retry: false });
  const assessmentQuery = useQuery({ queryKey: ['latestAssessment', userId], queryFn: () => getLatestAssessment(userId as string), enabled: !!userId, retry: false });

  const firstName = profileQuery.data?.firstName ?? 'Member';
  const initial = firstName.charAt(0).toUpperCase();
  const primaryGoal = assessmentQuery.data?.goals.find(goal => goal.priority === 'PRIMARY') ?? assessmentQuery.data?.goals[0];
  const subtitle = assessmentQuery.data
    ? `${EXPERIENCE_LABELS[assessmentQuery.data.trainingExperience]}${primaryGoal ? ` · ${GOAL_LABELS[primaryGoal.type]}` : ''}`
    : 'Complete your assessment';

  return <Screen>
    <Header title="Profile" onBack={() => navigation.goBack()} />
    <View style={s.card}>
      <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
      <View>
        <Text style={s.name}>{firstName}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={s.statRow}>
      <View style={s.stat}><Text style={s.statValue}>—</Text><Text style={s.statLabel}>Workouts</Text></View>
      <View style={s.stat}><Text style={s.statValue}>—</Text><Text style={s.statLabel}>Day streak</Text></View>
      <View style={s.stat}><Text style={s.statValue}>{memberSince(userQuery.data?.createdAt)}</Text><Text style={s.statLabel}>Member</Text></View>
    </View>
    <View style={s.list}>
      <Row label="Personal details" onPress={() => navigation.navigate('ProfilePersonalDetails')} />
      <Row label="Assessment answers" onPress={() => navigation.navigate('ProfileAssessmentAnswers')} />
      <Row label="Units and preferences" onPress={() => navigation.navigate('ProfileUnits')} />
      <Row label="Privacy and photos" onPress={() => navigation.navigate('ProfilePrivacyPhotos')} />
    </View>
    <View style={s.logout}>
      <Button secondary onPress={() => navigation.reset({ index: 0, routes: [{ name: 'EntryAccount' }] })}>Logout</Button>
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 22, marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, borderWidth: 2.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  list: { marginTop: 28 },
  logout: { marginTop: 36 },
});
