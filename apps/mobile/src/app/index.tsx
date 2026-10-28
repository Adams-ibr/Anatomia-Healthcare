import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  return <Redirect href={session ? '/(tabs)' : '/sign-in'} />;
}
