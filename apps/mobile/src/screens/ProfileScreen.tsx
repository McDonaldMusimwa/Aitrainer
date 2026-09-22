import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Hero, Header, Row, Screen } from '../components/ui';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  return <Screen>
    <Header title="Profile" onBack={() => navigation.goBack()} />
    <Hero title="Sam" subtitle="Intermediate · Build muscle" />
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

const s = StyleSheet.create({
  list: { marginTop: 28 },
  logout: { marginTop: 36 },
});
