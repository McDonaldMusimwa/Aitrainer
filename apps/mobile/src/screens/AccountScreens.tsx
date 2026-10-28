import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Button, Header, Input, Notice, Screen } from '../components/ui';
import { onPhoto } from '../theme';
import { registerUser } from '../api';
import { setCurrentUserId } from '../session';
import { updateDraft } from '../onboardingDraft';
import type { RootStackParamList } from '../navigation';

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
const introImage = require('../assets/imgs/intropic.png');
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Large white title block that sits on the photo's dark lower half. */
function Intro({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={s.intro}>
    <Text accessibilityRole="header" style={s.title}>{title}</Text>
    <Text style={s.subtitle}>{subtitle}</Text>
  </View>;
}

export function EntryAccountScreen({ navigation }: Props<'EntryAccount'>) {
  return <Screen background={introImage}>
    <View style={s.push} />
    <Intro title={'Your trainer,\nbuilt around you'} subtitle="Training and nutrition that adapt as you progress." />
    <View style={s.welcomeActions}>
      <View style={s.half}><Button onPhoto secondary onPress={() => navigation.navigate('Login')}>Log in</Button></View>
      <View style={s.half}><Button onPhoto onPress={() => navigation.navigate('SignUp')}>Sign up</Button></View>
    </View>
    <Text style={s.caption}>Private by design. You control your data</Text>
  </Screen>;
}

export function SignUpScreen({ navigation }: Props<'SignUp'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const registration = useMutation({
    mutationFn: () => registerUser({ email: email.trim(), password }),
    onSuccess: user => {
      setCurrentUserId(user.id);
      const [firstName, ...rest] = name.trim().split(/\s+/);
      updateDraft({ firstName, lastName: rest.join(' ') || undefined });
      navigation.navigate('AssessmentWelcome');
    },
  });

  function submit() {
    setSubmitted(true);
    const valid = !!name.trim() && validEmail(email) && password.length >= 8 && password === confirm;
    if (valid) registration.mutate();
  }
  return <Screen background={introImage}>
    <Header onPhoto title="Create Account" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('EntryAccount')} />
    <View style={s.push} />
    <Intro title="Start strong" subtitle="A few details and we'll build a plan around you." />
    <View style={s.form}>
      <Input onPhoto placeholder="Full name" autoComplete="name" textContentType="name" value={name} onChangeText={setName} error={submitted && !name.trim() ? 'Enter your full name.' : undefined} returnKeyType="next" />
      <Input onPhoto placeholder="Email address" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} error={submitted && !validEmail(email) ? 'Enter a valid email address.' : undefined} />
      <Input onPhoto placeholder="Password" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" value={password} onChangeText={setPassword} error={submitted && password.length < 8 ? 'Use at least 8 characters.' : undefined} />
      <Input onPhoto placeholder="Confirm Password" secureTextEntry autoCapitalize="none" textContentType="newPassword" value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} returnKeyType="done" error={submitted && (!confirm || confirm !== password) ? 'Passwords must match.' : undefined} />
    </View>
    <View style={s.actions}>
      <Button onPhoto onPress={submit} disabled={registration.isPending}>{registration.isPending ? 'Creating account…' : 'Continue'}</Button>
      <Text style={s.caption}>By continuing, you agree to the terms and privacy policy.</Text>
    </View>
    {registration.isError && <Notice>{registration.error instanceof Error ? registration.error.message : 'Could not create your account. Please try again.'}</Notice>}
  </Screen>;
}

export function LoginScreen({ navigation }: Props<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function submit() {
    // TODO: remove once login is hooked up to the backend; any input is accepted for now.
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }
  return <Screen background={introImage}>
    <Header onPhoto title="Welcome Back" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('EntryAccount')} />
    <View style={s.push} />
    <Intro title="Continue your plan" subtitle="Log in to see today's workout" />
    <View style={s.form}>
      <Input onPhoto placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} />
      <Input onPhoto placeholder="Password" secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" value={password} onChangeText={setPassword} returnKeyType="go" onSubmitEditing={submit} />
    </View>
    <View style={s.actions}>
      <Button onPhoto onPress={submit}>Log in</Button>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ForgotPassword')} style={s.textButton}><Text style={s.caption}>Forgot your password</Text></Pressable>
    </View>
  </Screen>;
}

export function ForgotPasswordScreen({ navigation }: Props<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(false);
  function submit() { setSubmitted(true); setNotice(validEmail(email)); }
  return <Screen background={introImage}>
    <Header onPhoto title="Reset password" onBack={() => {
      const state = navigation.getState();
      if (state.routes[state.index - 1]?.name === 'Login') navigation.goBack();
      else navigation.reset({ index: 1, routes: [{ name: 'EntryAccount' }, { name: 'Login' }] });
    }} />
    <View style={s.push} />
    <Intro title="Forgot your password?" subtitle="Enter your email and we will send a reset link." />
    <Input onPhoto placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" value={email} onChangeText={v => { setEmail(v); setNotice(false); }} onSubmitEditing={submit} returnKeyType="send" error={submitted && !validEmail(email) ? 'Enter a valid email address.' : undefined} />
    <View style={s.actions}><Button onPhoto onPress={submit}>Reset Link</Button></View>
    {notice && <Notice>Password reset is not connected yet. No reset email has been sent.</Notice>}
  </Screen>;
}

const s = StyleSheet.create({
  // Fills the space above the content so it sits on the darker bottom of the photo, but
  // collapses (and the screen scrolls) when the keyboard or a long form needs the room.
  push: { flexGrow: 1, minHeight: 24 },
  intro: { gap: 10, marginBottom: 28 },
  title: { fontSize: 36, lineHeight: 41, fontWeight: '800', letterSpacing: -0.8, color: onPhoto.text },
  subtitle: { fontSize: 15, lineHeight: 22, fontWeight: '500', color: onPhoto.muted },
  caption: { textAlign: 'center', fontSize: 13, lineHeight: 20, color: onPhoto.muted, fontWeight: '500' },
  welcomeActions: { flexDirection: 'row', gap: 14, marginBottom: 18 }, half: { flex: 1 },
  form: { gap: 14 }, actions: { marginTop: 28, gap: 14 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
