import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Header, Pill, Row, Screen, SectionLabel } from '../components/ui';
import { useStyles, useTheme, type AppColors, type ThemePreference } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;
const APPEARANCE: { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'System', value: 'system' },
];

export default function ProfileScreen({ navigation }: Props) {
  const s = useStyles(makeS);
  const { preference, setPreference } = useTheme();
  return <Screen>
    <Header title="Profile" onBack={() => navigation.goBack()} />
    <View style={s.card}>
      <View style={s.avatar}><Text style={s.avatarText}>S</Text></View>
      <View>
        <Text style={s.name}>Sam</Text>
        <Text style={s.subtitle}>Intermediate · Build muscle</Text>
      </View>
    </View>
    <View style={s.statRow}>
      <View style={s.stat}><Text style={s.statValue}>42</Text><Text style={s.statLabel}>Workouts</Text></View>
      <View style={s.stat}><Text style={s.statValue}>6</Text><Text style={s.statLabel}>Day streak</Text></View>
      <View style={s.stat}><Text style={s.statValue}>9wk</Text><Text style={s.statLabel}>Member</Text></View>
    </View>
    <View style={s.appearance}>
      <SectionLabel>Appearance</SectionLabel>
      <View style={s.appearanceRow}>
        {APPEARANCE.map(option => <View key={option.value} style={s.appearanceOption}>
          <Pill label={option.label} selected={preference === option.value} onPress={() => setPreference(option.value)} />
        </View>)}
      </View>
    </View>
    <View style={s.list}>
      <Row label="Personal details" onPress={() => {}} />
      <Row label="Assessment answers" onPress={() => {}} />
      <Row label="Units and preferences" onPress={() => {}} />
      <Row label="Privacy and photos" onPress={() => {}} />
    </View>
    <View style={s.logout}>
      <Button secondary onPress={() => navigation.reset({ index: 0, routes: [{ name: 'EntryAccount' }] })}>Logout</Button>
    </View>
  </Screen>;
}

const makeS = (colors: AppColors) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 22, marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, borderWidth: 2.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  appearance: { marginTop: 28 }, appearanceRow: { flexDirection: 'row', gap: 10 }, appearanceOption: { flex: 1 },
  list: { marginTop: 28 },
  logout: { marginTop: 36 },
});
