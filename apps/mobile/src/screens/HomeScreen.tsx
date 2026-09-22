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
      <Text style={s.greeting}>Good morning, Sam</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={s.avatar}>
        <Text style={s.avatarText}>S</Text>
      </Pressable>
    </View>
    <View style={s.hero}>
      <Text style={s.heroEyebrow}>Today</Text>
      <Text style={s.heroTitle}>{today.label}</Text>
      <Text style={s.heroDetail}>{today.exercises.length} exercises · about 45 min</Text>
      <Button onPress={() => navigation.navigate('TodayWorkout', { day: today.id })}>Start workout</Button>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 28 },
  greeting: { fontSize: 20, fontWeight: '600', color: colors.ink },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.accentForeground },
  hero: { backgroundColor: colors.accent, borderRadius: 28, padding: 24, gap: 6 },
  heroEyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.accentForeground, textTransform: 'uppercase' },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.accentForeground },
  heroDetail: { fontSize: 13, color: colors.accentForeground, marginBottom: 16 },
  section: { marginTop: 28 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cardDetail: { fontSize: 13, color: colors.muted },
});
