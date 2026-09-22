import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PlanTabScreen from '../screens/PlanTabScreen';
import ChatScreen from '../screens/ChatScreen';
import ProgressScreen from '../screens/ProgressScreen';
import type { MainTabParamList } from '../navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TAB_ICON: Record<keyof MainTabParamList, string> = { Home: '⌂', Plan: '▤', Coach: '◎', Progress: '↗' };

function TabButton({ children, ...props }: BottomTabBarButtonProps) {
  return <Pressable {...(props as any)} style={styles.tabButton}>{children}</Pressable>;
}

export default function MainTabs() {
  return <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.ink,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarButton: TabButton,
      tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{TAB_ICON[route.name as keyof MainTabParamList]}</Text>,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Plan" component={PlanTabScreen} />
    <Tab.Screen name="Coach" component={ChatScreen} />
    <Tab.Screen name="Progress" component={ProgressScreen} />
  </Tab.Navigator>;
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 8, paddingBottom: 10 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  icon: { fontSize: 20 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
