import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, rpc } from './supabase';
import { ensurePkceCrypto } from './pkceCrypto';

const pendingName = 'miamatch.auth.name';
export async function sendEmailLink(email: string, name: string, redirectTo: string) {
  if (!supabase) throw new Error('La connexion est indisponible.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new Error('Saisissez une adresse email valide.');
  ensurePkceCrypto();
  await AsyncStorage.setItem(pendingName, name.trim() || 'Convive');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) {
    if (error.code === 'email_address_not_authorized')
      throw new Error(
        'Pour cet essai, utilisez l’adresse de votre compte Supabase. Les autres adresses ne sont pas encore autorisées.',
      );
    if (error.status === 429)
      throw new Error(
        'Trop de demandes de connexion. Patientez avant de demander un nouveau lien.',
      );
    throw error;
  }
}

// Keep one exchange promise so duplicate route effects cannot consume a code twice.
let lastExchange: { key: string; promise: Promise<void> } | undefined;
export function exchangeEmailCode(code: string, flowId?: string) {
  const key = JSON.stringify([code, flowId]);
  if (lastExchange?.key === key) return lastExchange.promise;
  const promise = (async () => {
    if (!supabase) throw new Error('La connexion est indisponible.');
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (error)
      throw new Error(
        'Ce lien ne peut plus être utilisé ici. Demandez un nouveau lien et ouvrez-le sur le téléphone qui l’a demandé.',
      );
  })();
  lastExchange = { key, promise };
  return promise;
}

export async function finishEmailLogin() {
  if (!supabase) throw new Error('La connexion est indisponible.');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Reconnectez-vous pour continuer.');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile)
    await rpc('setup_profile', {
      display_name: (await AsyncStorage.getItem(pendingName)) || 'Convive',
    });
  await AsyncStorage.removeItem(pendingName);
  const { data: member, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (memberError) throw memberError;
  return member?.household_id as string | undefined;
}
