import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Field, Heading, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
  const { signUp, session } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  if (session) { router.replace('/(tabs)'); return null; }
  const submit = async () => {
    setBusy(true); setError(''); setMessage('');
    try { await signUp(email, password, name); setMessage('Account created. If email confirmation is enabled, check your inbox before signing in.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not create your account. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Screen style={{ paddingTop: 34 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: colors.brand, fontWeight: '800', letterSpacing: 2, fontSize: 12, marginBottom: 22 }}>ANATOMIA  /  LEARN</Text>
    <Heading eyebrow="Build practical knowledge">Create your account</Heading>
    <Card>
      <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 8 }}>Join the learning community and access your courses from any device.</Text>
      {error ? <Notice>{error}</Notice> : null}{message ? <Notice>{message}</Notice> : null}
      <Field label="Full name" value={name} onChangeText={setName} textContentType="name" placeholder="Your name" autoCapitalize="words" />
      <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" placeholder="At least 8 characters" />
      <Button onPress={submit} disabled={busy || !name || !email || password.length < 8}>{busy ? 'Creating account…' : 'Create account'}</Button>
      <View style={{ alignItems: 'center', marginTop: 14 }}><Text style={{ color: colors.muted }}>Already registered? <Link href="/sign-in" style={{ color: colors.brand, fontWeight: '700' }}>Sign in</Link></Text></View>
    </Card>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
