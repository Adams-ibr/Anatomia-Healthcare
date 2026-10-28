import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore has small per-value limits on some iOS versions. Chunking keeps
// large refreshed sessions from failing to persist while keeping each chunk encrypted.
const chunkSize = 1800;
const chunkKey = (key: string, index: number) => `${key}:chunk:${index}`;
const secureStorage = {
  async getItem(key: string) {
    const manifest = await SecureStore.getItemAsync(key);
    if (!manifest?.startsWith('chunks:')) return manifest;
    const count = Number(manifest.slice('chunks:'.length));
    if (!Number.isInteger(count) || count < 1 || count > 512) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))));
    return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join('') : null;
  },
  async setItem(key: string, value: string) {
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${chunkSize}}`, 'g')) ?? [''];
    if (chunks.length > 512) throw new Error('The saved sign-in session is too large to store securely.');
    for (let index = 0; index < chunks.length; index += 1) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunks[index]);
    }
    const previous = await SecureStore.getItemAsync(key);
    const previousCount = previous?.startsWith('chunks:') ? Number(previous.slice('chunks:'.length)) : 0;
    await SecureStore.setItemAsync(key, `chunks:${chunks.length}`);
    for (let index = chunks.length; index < previousCount; index += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, index));
    }
  },
  async removeItem(key: string) {
    const previous = await SecureStore.getItemAsync(key);
    const count = previous?.startsWith('chunks:') ? Number(previous.slice('chunks:'.length)) : 0;
    await SecureStore.deleteItemAsync(key);
    for (let index = 0; index < Math.min(count, 512); index += 1) {
      await SecureStore.deleteItemAsync(chunkKey(key, index));
    }
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: secureStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        lock: processLock,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add the mobile environment variables and restart Expo.');
  return supabase;
}
