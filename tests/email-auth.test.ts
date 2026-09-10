import { test, expect, jest, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendEmailLink, exchangeEmailCode, finishEmailLogin } from '../src/data/emailAuth';
import { supabase, rpc } from '../src/data/supabase';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/data/supabase', () => ({
  supabase: {
    auth: { signInWithOtp: jest.fn(), exchangeCodeForSession: jest.fn(), getUser: jest.fn() },
    from: jest.fn(),
  },
  rpc: jest.fn(),
}));
jest.mock('../src/data/pkceCrypto', () => ({ ensurePkceCrypto: jest.fn() }));
const auth = supabase!.auth as jest.Mocked<NonNullable<typeof supabase>['auth']>;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
test('requests the standard email template with a mobile redirect and persists the name', async () => {
  auth.signInWithOtp.mockResolvedValue({ error: null } as never);
  await sendEmailLink(' alice@example.com ', ' Alice ', 'miamatch://auth/callback');
  expect(auth.signInWithOtp).toHaveBeenCalledWith({
    email: 'alice@example.com',
    options: { emailRedirectTo: 'miamatch://auth/callback' },
  });
  expect(await AsyncStorage.getItem('miamatch.auth.name')).toBe('Alice');
});
test('rejects invalid email without sending and explains default SMTP restrictions', async () => {
  await expect(sendEmailLink('bad', 'Alice', 'miamatch://auth/callback')).rejects.toThrow('valide');
  expect(auth.signInWithOtp).not.toHaveBeenCalled();
  auth.signInWithOtp.mockResolvedValue({
    error: { code: 'email_address_not_authorized' },
  } as never);
  await expect(
    sendEmailLink('alice@example.com', 'Alice', 'miamatch://auth/callback'),
  ).rejects.toThrow('compte Supabase');
});
test('duplicate callback effects exchange a PKCE code only once', async () => {
  auth.exchangeCodeForSession.mockResolvedValue({ error: null } as never);
  await Promise.all([exchangeEmailCode('one-use', 'flow'), exchangeEmailCode('one-use', 'flow')]);
  expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('one-use', { flowId: 'flow' });
});
test('expired or foreign-device link is rejected without accepting URL tokens', async () => {
  auth.exchangeCodeForSession.mockResolvedValue({
    error: { message: 'invalid verifier' },
  } as never);
  await expect(exchangeEmailCode('expired')).rejects.toThrow('téléphone');
});
test.each([true, false])('profile completion preserves existing profile: %s', async (existing) => {
  auth.getUser.mockResolvedValue({ data: { user: { id: 'alice' } }, error: null } as never);
  await AsyncStorage.setItem('miamatch.auth.name', 'Alice');
  (supabase!.from as jest.Mock).mockImplementation((table) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data:
            table === 'profiles' ? (existing ? { id: 'alice' } : null) : { household_id: 'home' },
          error: null,
        }),
      }),
    }),
  }));
  expect(await finishEmailLogin()).toBe('home');
  if (existing) expect(rpc).not.toHaveBeenCalled();
  else expect(rpc).toHaveBeenCalledWith('setup_profile', { display_name: 'Alice' });
  expect(await AsyncStorage.getItem('miamatch.auth.name')).toBeNull();
});
