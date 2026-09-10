import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
// Chunk native sessions to respect SecureStore value size limits.
const storage =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        async getItem(key: string) {
          const count = Number(await SecureStore.getItemAsync(`${key}.count`));
          if (!count) return null;
          const parts = await Promise.all(
            Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)),
          );
          return parts.every((p) => p !== null) ? parts.join('') : null;
        },
        async setItem(key: string, value: string) {
          const old = Number(await SecureStore.getItemAsync(`${key}.count`));
          const count = Math.ceil(value.length / 1500);
          for (let i = 0; i < count; i++)
            await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * 1500, (i + 1) * 1500));
          await SecureStore.setItemAsync(`${key}.count`, String(count));
          for (let i = count; i < old; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
        },
        async removeItem(key: string) {
          const count = Number(await SecureStore.getItemAsync(`${key}.count`));
          for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
          await SecureStore.deleteItemAsync(`${key}.count`);
        },
      };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
          lock: processLock,
        },
      })
    : null;
export class RpcError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!supabase)
    throw new Error('Supabase n’est pas encore connecté. Le mode démo est disponible.');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new RpcError(error.message, error.code);
  return data as T;
}
