import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EntryAccountScreen, SignUpScreen, LoginScreen, ForgotPasswordScreen } from './src/screens/AccountScreens';
import ChatScreen from './src/screens/ChatScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.ink, border: colors.border, primary: colors.primary, notification: colors.accent } };

export default function App() {
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    <NavigationContainer theme={theme} linking={{ prefixes: ['aitrainer://'], config: { initialRouteName: 'EntryAccount', screens: { EntryAccount: '', SignUp: 'sign-up', Login: 'login', ForgotPassword: 'forgot-password', Chat: 'chat' } } }}>
      <Stack.Navigator initialRouteName="EntryAccount" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="EntryAccount" component={EntryAccountScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Aitrainer demo' }} />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>;
}
