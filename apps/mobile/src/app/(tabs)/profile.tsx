import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, colors, Heading, Screen } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { session, role, signOut } = useAuth();
  return <Screen style={{ paddingTop: 28 }}><Heading eyebrow="Your account">Profile</Heading><Card>
    <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft }}><Text style={{ color: colors.brand, fontSize: 20, fontWeight: '800' }}>{(session?.user.email?.[0] ?? 'A').toUpperCase()}</Text></View>
    <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '700' }}>{session?.user.user_metadata?.full_name || 'Anatomia member'}</Text>
    <Text style={{ color: colors.muted }}>{session?.user.email}</Text>
    <Text style={{ alignSelf: 'flex-start', color: colors.brand, backgroundColor: colors.brandSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, fontWeight: '700', textTransform: 'capitalize' }}>{role}</Text>
  </Card><View style={{ marginTop: 20 }}><Button variant="secondary" onPress={async () => { await signOut(); router.replace('/sign-in'); }}>Sign out</Button></View></Screen>;
}
