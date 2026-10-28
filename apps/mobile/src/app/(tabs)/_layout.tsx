import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function TabLayout() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}><ActivityIndicator color={colors.brand} /></View>;
  if (!session) return <Redirect href="/sign-in" />;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.brand,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 62, paddingTop: 8, paddingBottom: 7 },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="courses" options={{ title: 'Courses' }} />
    <Tabs.Screen name="learning" options={{ title: 'Learning' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}
