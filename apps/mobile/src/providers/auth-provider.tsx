import type { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { requireSupabase } from '@/lib/supabase';

export type AppRole = 'student' | 'instructor' | 'admin' | 'support';
type AuthContextValue = {
  session: Session | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const knownRoles = new Set<AppRole>(['student', 'instructor', 'admin', 'support']);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = requireSupabase();
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    }).catch(() => setLoading(false));
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const claims = session?.user.app_metadata ?? {};
    const candidate = claims.role ?? claims.account_type;
    const role = knownRoles.has(candidate) ? candidate as AppRole : 'student';
    return {
      session,
      role,
      loading,
      signIn: async (email, password) => {
        const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      signUp: async (email, password, name) => {
        const { error } = await requireSupabase().auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        const client = requireSupabase();
        const redirectTo = Linking.createURL('auth/callback', { scheme: 'anatomia' });
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (!data.url) throw new Error('Google sign-in could not be started.');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success' || !result.url) return;
        const callback = Linking.parse(result.url);
        const query = callback.queryParams ?? {};
        if (query.error_description) throw new Error(String(query.error_description));
        if (typeof query.code !== 'string') throw new Error('Google sign-in did not return an authorization code.');
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(query.code);
        if (exchangeError) throw exchangeError;
      },
      signOut: async () => {
        const { error } = await requireSupabase().auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
