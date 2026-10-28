import { requireSupabase } from '@/lib/supabase';

const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export async function authApi<T>(path: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  if (!baseUrl || !anonKey) throw new Error('The Anatomia API is not configured for this build.');
  const token = options.token ?? (await requireSupabase().auth.getSession()).data.session?.access_token;
  const response = await fetch(`${baseUrl}/functions/v1/auth${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new Error(payload.error || payload.message || `Request failed (${response.status}).`);
  return payload as T;
}
