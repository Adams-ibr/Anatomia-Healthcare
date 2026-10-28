import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Field, Heading, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function SignInScreen() {
  const { signIn, signInWithGoogle, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  if (session) { router.replace('/(tabs)'); return null; }

  const submit = async () => {
    setBusy(true); setError('');
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.'); }
    finally { setBusy(false); }
  };

  return <Screen style={{ paddingTop: 34 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: colors.brand, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginBottom: 22 }}>ANATOMIA  /  LEARN</Text>
    <Heading eyebrow="Your learning, wherever you are">Welcome back</Heading>
    <Card>
      <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 8 }}>Sign in to continue your courses, track your progress, and pick up where you left off.</Text>
      {error ? <Notice>{error}</Notice> : null}
      <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" placeholder="Your password" autoComplete="current-password" />
      <Button onPress={submit} disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      <View style={{ height: 12 }} />
      <Button variant="secondary" onPress={async () => { setGoogleBusy(true); setError(''); try { await signInWithGoogle(); router.replace('/(tabs)'); } catch (e) { setError(e instanceof Error ? e.message : 'Google sign-in failed.'); } finally { setGoogleBusy(false); } }} disabled={googleBusy}>{googleBusy ? 'Opening Google…' : 'Continue with Google'}</Button>
      <View style={{ alignItems: 'center', marginTop: 14 }}><Text style={{ color: colors.muted }}>New to Anatomia? <Link href="/sign-up" style={{ color: colors.brand, fontWeight: '700' }}>Create an account</Link></Text></View>
    </Card>
    <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 22, fontSize: 12, lineHeight: 18 }}>Use your existing Anatomia account. Demo credentials are not included.</Text>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
