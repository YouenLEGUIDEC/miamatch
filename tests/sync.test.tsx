import React from 'react';
import { test, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from '../src/state/AppProvider';
import { initialDemo } from '../src/state/demo';
import { reduce } from '../src/domain/reducer';
import { recipes } from '../src/data/catalog';
import { rpc } from '../src/data/supabase';
import { Action, Snapshot } from '../src/domain/model';
jest.mock('expo-crypto', () => ({ randomUUID: () => require('node:crypto').randomUUID() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/data/supabase', () => ({
  RpcError: class extends Error {},
  rpc: jest.fn(),
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      startAutoRefresh: () => {},
      stopAutoRefresh: () => {},
    },
    from: () => ({
      select: () => ({
        order: () => ({
          range: async () => ({
            data: require('../src/data/recipes.json').map((r: unknown) => ({ display_data: r })),
            error: null,
          }),
        }),
      }),
    }),
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: async () => {},
  },
}));
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test('offline checkbox is persisted, retried with same id, then receives server acknowledgement', async () => {
  let server: Snapshot = {
    ...initialDemo('Alice').snapshot,
    householdId: 'live-household',
    userId: 'live-user',
    shopping: [
      {
        id: 'rice:g',
        ingredientId: 'rice',
        name: 'Riz',
        aisle: 'Épicerie',
        quantity: 300,
        unit: 'g',
        checked: false,
        manual: false,
        pantry: false,
      },
    ],
  };
  let offline = true;
  const operationIds: string[] = [];
  (rpc as jest.MockedFunction<typeof rpc>).mockImplementation(
    async <T,>(name: string, args?: Record<string, unknown>): Promise<T> => {
      if (name === 'household_snapshot') return structuredClone(server) as T;
      operationIds.push(args!.operation_id as string);
      if (offline) throw new Error('Connexion interrompue');
      server = reduce(server, args!.action as Action, recipes);
      return structuredClone(server) as T;
    },
  );
  const { result, unmount } = await renderHook(() => useApp(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
  await waitFor(() => expect(result.current.ready).toBe(true));
  await act(async () => {
    await result.current.loadHousehold('live-household');
  });
  await act(async () => {
    await result.current.dispatch({ type: 'shopping-check', id: 'rice:g', checked: true });
  });
  await waitFor(() => expect(result.current.pending).toBe(1));
  expect(result.current.snapshot!.shopping[0].checked).toBe(true);
  const queue = JSON.parse(
    (await AsyncStorage.getItem('miamatch.queue.live-user.live-household'))!,
  );
  expect(queue[0].action.checked).toBe(true);
  offline = false;
  await waitFor(() => expect(result.current.pending).toBe(0), { timeout: 7000, interval: 100 });
  expect(operationIds.length).toBeGreaterThanOrEqual(2);
  expect(new Set(operationIds).size).toBe(1);
  expect(server.shopping[0].checked).toBe(true);
  expect(result.current.snapshot!.shopping[0].checked).toBe(true);
  await unmount();
}, 15000);
