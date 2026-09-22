import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Screen, SectionLabel } from '../components/ui';
import { colors } from '../theme';
import { findDay } from '../data/plan';
import type { MainTabParamList, RootStackParamList } from '../navigation';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Home'>, NativeStackScreenProps<RootStackParamList>>;

export default function HomeScreen({ navigation }: Props) {
  const today = findDay('A');
  return <Screen>
    <View style={s.topBar}>
      <View>
        <Text style={s.eyebrow}>GOOD MORNING</Text>
        <Text style={s.greeting}>Sam</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={s.avatar}>
        <Text style={s.avatarText}>S</Text>
      </Pressable>
    </View>
    <View style={s.hero}>
      <Text style={s.heroTag}>TODAY</Text>
      <Text style={s.heroTitle}>{today.label}</Text>
      <Text style={s.heroDetail}>{today.exercises.length} exercises · about 45 min</Text>
      <Button onPress={() => navigation.navigate('TodayWorkout', { day: today.id })}>Start Workout</Button>
    </View>
    <View style={s.actionsRow}>
      <Pressable accessibilityRole="button" onPress={() => {}} style={s.actionTile}>
        <Text style={s.actionLabel}>Log Weight</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Coach')} style={s.actionTile}>
        <Text style={s.actionLabel}>Ask Coach</Text>
      </Pressable>
    </View>
    <View style={s.section}>
      <SectionLabel>This week</SectionLabel>
      <Card><Text style={s.cardTitle}>1 of 3 workouts done</Text><Text style={s.cardDetail}>Keep it up — two sessions to go.</Text></Card>
    </View>
    <View style={s.section}>
      <SectionLabel>Coach insight</SectionLabel>
      <Card onPress={() => navigation.navigate('WorkoutAdjust')}>
        <Text style={s.cardTitle}>Your last workout was completed as planned</Text>
        <Text style={s.cardDetail}>Tap to adjust today's session or ask your coach a question.</Text>
      </Card>
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 26 },
  eyebrow: { fontSize: 12, fontWeight: '600', color: colors.muted },
  greeting: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 22 },
  heroTag: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, color: colors.ink, backgroundColor: colors.secondary, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  heroDetail: { fontSize: 14, color: colors.muted, marginBottom: 18 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  actionTile: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  section: { marginTop: 28 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cardDetail: { fontSize: 13, color: colors.muted },
});
