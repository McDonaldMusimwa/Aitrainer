import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EntryAccountScreen, SignUpScreen, LoginScreen, ForgotPasswordScreen } from './src/screens/AccountScreens';
import {
  AssessmentWelcomeScreen, AssessmentBasicsScreen, AssessmentGoalsScreen, AssessmentExperienceScreen,
  AssessmentScheduleScreen, AssessmentEquipmentScreen, AssessmentHealthScreen, AssessmentNutritionScreen,
  AssessmentPhotosScreen, AssessmentReviewScreen,
} from './src/screens/AssessmentScreens';
import { PlanReadyScreen, PlanFirstScreen, PlanWorkoutPreviewScreen } from './src/screens/PlanScreens';
import { TodayWorkoutScreen, ExerciseDetailScreen, WorkoutCompleteScreen, WorkoutAdjustScreen } from './src/screens/WorkoutScreens';
import MainTabs from './src/screens/MainTabs';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.ink, border: colors.border, primary: colors.primary, notification: colors.accent } };

export default function App() {
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    <NavigationContainer<RootStackParamList>
      theme={theme}
      linking={{
        prefixes: ['aitrainer://'],
        config: {
          initialRouteName: 'EntryAccount',
          screens: {
            EntryAccount: '', SignUp: 'sign-up', Login: 'login', ForgotPassword: 'forgot-password',
            AssessmentWelcome: 'assessment', AssessmentBasics: 'assessment/basics', AssessmentGoals: 'assessment/goals',
            AssessmentExperience: 'assessment/experience', AssessmentSchedule: 'assessment/schedule',
            AssessmentEquipment: 'assessment/equipment', AssessmentHealth: 'assessment/health',
            AssessmentNutrition: 'assessment/nutrition', AssessmentPhotos: 'assessment/photos', AssessmentReview: 'assessment/review',
            PlanReady: 'plan/ready', PlanFirst: 'plan/first', PlanWorkoutPreview: 'plan/preview',
            Main: { screens: { Home: 'home', Plan: 'plan', Coach: 'chat', Progress: 'progress' } },
            TodayWorkout: 'workout/today', ExerciseDetail: 'workout/exercise', WorkoutComplete: 'workout/complete',
            WorkoutAdjust: 'workout/adjust', Profile: 'profile',
          },
        },
      }}
    >
      <Stack.Navigator initialRouteName="EntryAccount" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="EntryAccount" component={EntryAccountScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AssessmentWelcome" component={AssessmentWelcomeScreen} />
        <Stack.Screen name="AssessmentBasics" component={AssessmentBasicsScreen} />
        <Stack.Screen name="AssessmentGoals" component={AssessmentGoalsScreen} />
        <Stack.Screen name="AssessmentExperience" component={AssessmentExperienceScreen} />
        <Stack.Screen name="AssessmentSchedule" component={AssessmentScheduleScreen} />
        <Stack.Screen name="AssessmentEquipment" component={AssessmentEquipmentScreen} />
        <Stack.Screen name="AssessmentHealth" component={AssessmentHealthScreen} />
        <Stack.Screen name="AssessmentNutrition" component={AssessmentNutritionScreen} />
        <Stack.Screen name="AssessmentPhotos" component={AssessmentPhotosScreen} />
        <Stack.Screen name="AssessmentReview" component={AssessmentReviewScreen} />
        <Stack.Screen name="PlanReady" component={PlanReadyScreen} />
        <Stack.Screen name="PlanFirst" component={PlanFirstScreen} />
        <Stack.Screen name="PlanWorkoutPreview" component={PlanWorkoutPreviewScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="TodayWorkout" component={TodayWorkoutScreen} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} />
        <Stack.Screen name="WorkoutAdjust" component={WorkoutAdjustScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>;
}
