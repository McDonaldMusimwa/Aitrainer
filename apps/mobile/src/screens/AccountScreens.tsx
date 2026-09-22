import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Header, Hero, Input, Notice, Screen } from '../components/ui';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function EntryAccountScreen({ navigation }: Props<'EntryAccount'>) {
  return <Screen>
    <View style={s.welcomeHero}><Hero title={'Your trainer,\nbuilt around you'} subtitle="Training and nutrition that adapt as you progress." /></View>
    <View style={s.welcomeActions}>
      <Button onPress={() => navigation.navigate('SignUp')}>Create Account</Button>
      <Button secondary onPress={() => navigation.navigate('Login')}>Already Have an account</Button>
      <Text style={s.caption}>Private by design. You control your data</Text>
    </View>
  </Screen>;
}

export function SignUpScreen({ navigation }: Props<'SignUp'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  function submit() {
    setSubmitted(true);
    const valid = !!name.trim() && validEmail(email) && password.length >= 8 && password === confirm;
    if (valid) navigation.navigate('AssessmentWelcome');
  }
  return <Screen>
    <Header title="Create Account" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('EntryAccount')} />
    <View style={s.form}>
      <Input placeholder="Full name" autoComplete="name" textContentType="name" value={name} onChangeText={setName} error={submitted && !name.trim() ? 'Enter your full name.' : undefined} returnKeyType="next" />
      <Input placeholder="Email address" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} error={submitted && !validEmail(email) ? 'Enter a valid email address.' : undefined} />
      <View style={s.passwordGap} />
      <Input placeholder="Password" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" value={password} onChangeText={setPassword} error={submitted && password.length < 8 ? 'Use at least 8 characters.' : undefined} />
      <Input placeholder="Confirm Password" secureTextEntry autoCapitalize="none" textContentType="newPassword" value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} returnKeyType="done" error={submitted && (!confirm || confirm !== password) ? 'Passwords must match.' : undefined} />
    </View>
    <View style={s.signupActions}>
      <Button onPress={submit}>Continue</Button>
      <Text style={s.caption}>By continuing, you agree to the terms and privacy policy.</Text>
    </View>
  </Screen>;
}

export function LoginScreen({ navigation }: Props<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function submit() {
    // TODO: remove once login is hooked up to the backend; any input is accepted for now.
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }
  return <Screen>
    <Header title="Welcome Back" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('EntryAccount')} />
    <View style={s.loginHero}><Hero title="Continue your plan" subtitle="Log in to see today's workout" /></View>
    <View style={s.form}>
      <Input placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" value={password} onChangeText={setPassword} returnKeyType="go" onSubmitEditing={submit} />
    </View>
    <View style={s.loginActions}>
      <Button onPress={submit}>Log in</Button>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ForgotPassword')} style={s.textButton}><Text style={s.caption}>Forgot your password</Text></Pressable>
    </View>
  </Screen>;
}

export function ForgotPasswordScreen({ navigation }: Props<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(false);
  function submit() { setSubmitted(true); setNotice(validEmail(email)); }
  return <Screen>
    <Header title="Reset password" onBack={() => {
      const state = navigation.getState();
      if (state.routes[state.index - 1]?.name === 'Login') navigation.goBack();
      else navigation.reset({ index: 1, routes: [{ name: 'EntryAccount' }, { name: 'Login' }] });
    }} />
    <Text style={s.resetDescription}>Enter your email and we will send a reset link.</Text>
    <Input placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" value={email} onChangeText={v => { setEmail(v); setNotice(false); }} onSubmitEditing={submit} returnKeyType="send" error={submitted && !validEmail(email) ? 'Enter a valid email address.' : undefined} />
    <View style={s.resetActions}><Button onPress={submit}>Reset Link</Button></View>
    {notice && <Notice>Password reset is not connected yet. No reset email has been sent.</Notice>}
  </Screen>;
}

const s = StyleSheet.create({
  welcomeHero: { marginTop: 80 }, welcomeActions: { marginTop: 116, gap: 22, paddingHorizontal: 2 },
  caption: { textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.ink, fontWeight: '500' },
  form: { gap: 20 }, passwordGap: { height: 0 }, signupActions: { marginTop: 64, gap: 22, paddingHorizontal: 8 },
  loginHero: { marginBottom: 34, paddingHorizontal: 4 }, loginActions: { marginTop: 38, paddingHorizontal: 6 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  resetDescription: { fontSize: 16, lineHeight: 23, fontWeight: '500', textAlign: 'center', color: colors.ink, marginBottom: 16 },
  resetActions: { marginTop: 66, paddingHorizontal: 14 },
});
