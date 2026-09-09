import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Action, Recipe, Snapshot } from '../domain/model';
import { recipes as fixtures } from '../data/catalog';
import { supabase, rpc, RpcError } from '../data/supabase';
import { DemoData, demoAction, initialDemo, switchDemo } from './demo';
import { reduce } from '../domain/reducer';
import * as Crypto from 'expo-crypto';
type Pending = { id: string; action: Action };
type Context = {
  snapshot: Snapshot | null;
  recipes: Recipe[];
  mode: 'demo' | 'live' | null;
  ready: boolean;
  userId: string | null;
  error: string | null;
  pending: number;
  connected: boolean;
  dispatch: (a: Action) => Promise<void>;
  startDemo: (name: string) => Promise<void>;
  switchPlayer: () => Promise<void>;
  loadHousehold: (h: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  report: (e: unknown) => void;
};
const State = createContext<Context>(null!);
export const uid = () => Crypto.randomUUID();
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const current = useRef<Snapshot | null>(null);
  const [mode, setMode] = useState<Context['mode']>(null);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(fixtures);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [connected, setConnected] = useState(false);
  const catalogRef = useRef<Recipe[]>(fixtures);
  const demo = useRef<DemoData | null>(null);
  const queue = useRef<Pending[]>([]);
  const busy = useRef(false);
  const serial = useRef(Promise.resolve());
  const report = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
  function update(s: Snapshot) {
    current.current = s;
    setSnapshot(s);
    if (s.householdId !== 'demo')
      void AsyncStorage.setItem(
        `miamatch.cache.${s.userId}`,
        JSON.stringify({ snapshot: s, recipes: catalogRef.current }),
      ).catch(report);
  }
  const queueKey = (s: Snapshot) => `miamatch.queue.${s.userId}.${s.householdId}`;
  function overlay(s: Snapshot) {
    return {
      ...queue.current.reduce((v, p) => reduce(v, p.action, catalogRef.current), s),
      revision: s.revision,
    };
  }
  function accept(s: Snapshot) {
    if (current.current?.userId === s.userId && s.revision >= current.current.revision)
      update(overlay(s));
  }
  async function refresh() {
    const s = current.current;
    if (!s || s.householdId === 'demo') return;
    const next = await rpc<Snapshot>('household_snapshot', { h: s.householdId });
    accept(next);
  }
  async function flush() {
    if (busy.current || !current.current || current.current.householdId === 'demo') return;
    busy.current = true;
    try {
      while (queue.current.length) {
        const p = queue.current[0];
        const s = current.current!;
        try {
          const next = await rpc<Snapshot>('apply_action', {
            h: s.householdId,
            operation_id: p.id,
            action: p.action,
          });
          queue.current.shift();
          await AsyncStorage.setItem(queueKey(s), JSON.stringify(queue.current));
          setPending(queue.current.length);
          accept(next);
          setConnected(true);
        } catch (e) {
          report(e);
          if (
            e instanceof RpcError &&
            ['P0001', '42501', '23503', '23514', '22P02'].includes(e.code)
          ) {
            queue.current.shift();
            await AsyncStorage.setItem(queueKey(s), JSON.stringify(queue.current));
            setPending(queue.current.length);
            await refresh();
            continue;
          }
          setConnected(false);
          break;
        }
      }
    } finally {
      busy.current = false;
    }
  }
  async function loadHousehold(h: string) {
    const next = await rpc<Snapshot>('household_snapshot', { h });
    const { data, error: catalogError } = await supabase!
      .from('recipes')
      .select('display_data')
      .order('id')
      .range(0, 99);
    if (catalogError) throw new Error(catalogError.message);
    const catalog = (data ?? []).map((r) => r.display_data as Recipe);
    setRecipes(catalog);
    catalogRef.current = catalog;
    const stored = await AsyncStorage.getItem(queueKey(next));
    queue.current = stored ? JSON.parse(stored) : [];
    update(overlay(next));
    setPending(queue.current.length);
    setMode('live');
    setUserId(next.userId);
    setConnected(true);
  }
  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const local = await AsyncStorage.getItem('miamatch.demo');
        if (local) {
          const d: DemoData = JSON.parse(local);
          demo.current = d;
          update(d.snapshot);
          setMode('demo');
          setUserId(d.snapshot.userId);
        } else if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setUserId(data.session.user.id);
            setMode('live');
            const cached = await AsyncStorage.getItem(`miamatch.cache.${data.session.user.id}`);
            if (cached) {
              const c = JSON.parse(cached);
              catalogRef.current = c.recipes;
              setRecipes(c.recipes);
              update(c.snapshot);
              const stored = await AsyncStorage.getItem(queueKey(c.snapshot));
              queue.current = stored ? JSON.parse(stored) : [];
              setPending(queue.current.length);
            }
            const { data: member, error } = await supabase
              .from('household_members')
              .select('household_id')
              .eq('user_id', data.session.user.id)
              .maybeSingle();
            if (error) throw error;
            if (member) await loadHousehold(member.household_id);
          }
        }
      } catch (e) {
        report(e);
      } finally {
        if (mounted) setReady(true);
      }
    }
    void boot();
    const auth = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!demo.current) {
        setUserId(session?.user.id ?? null);
        if (session) setMode('live');
      }
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase?.auth.startAutoRefresh();
        void refresh().catch(report);
        void flush().catch(report);
      } else {
        supabase?.auth.stopAutoRefresh();
      }
    });
    return () => {
      mounted = false;
      auth?.data.subscription.unsubscribe();
      subscription.remove();
    };
    // Lifecycle subscription is intentionally installed once; refs carry current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (mode !== 'live' || !snapshot) return;
    const h = snapshot.householdId;
    const channel = supabase!
      .channel(`household:${h}`, { config: { private: true } })
      .on('broadcast', { event: 'changed' }, () => {
        void refresh().catch(report);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          void refresh().catch(report);
          void flush().catch(report);
        }
      });
    // Periodic refetch repairs lost broadcasts and resumes persisted checkbox writes.
    const timer = setInterval(() => {
      void refresh().catch(() => setConnected(false));
      void flush().catch(report);
    }, 5000);
    return () => {
      clearInterval(timer);
      void supabase!.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, snapshot?.householdId]);
  async function perform(a: Action) {
    if (!current.current) throw new Error('Créez ou rejoignez un foyer.');
    if (mode === 'demo' && demo.current) {
      demo.current = demoAction(demo.current, a);
      await AsyncStorage.setItem('miamatch.demo', JSON.stringify(demo.current));
      update(demo.current.snapshot);
      return;
    }
    const s = current.current;
    if (a.type === 'shopping-check') {
      const op = { id: uid(), action: a };
      queue.current.push(op);
      await AsyncStorage.setItem(queueKey(s), JSON.stringify(queue.current));
      setPending(queue.current.length);
      update({ ...reduce(s, a, recipes), revision: s.revision });
      void flush().catch(report);
      return;
    }
    const next = await rpc<Snapshot>('apply_action', {
      h: s.householdId,
      operation_id: uid(),
      action: a,
    });
    accept(next);
  }
  function dispatch(a: Action) {
    const task = serial.current.then(() => perform(a));
    serial.current = task.catch(() => {});
    return task.catch((e) => {
      report(e);
      throw e;
    });
  }
  async function startDemo(name: string) {
    const d = initialDemo(name.trim() || 'Moi');
    demo.current = d;
    await AsyncStorage.setItem('miamatch.demo', JSON.stringify(d));
    update(d.snapshot);
    setMode('demo');
    setUserId(d.snapshot.userId);
    setRecipes(fixtures);
  }
  async function switchPlayer() {
    if (!demo.current) return;
    demo.current = switchDemo(demo.current);
    await AsyncStorage.setItem('miamatch.demo', JSON.stringify(demo.current));
    update(demo.current.snapshot);
    setUserId(demo.current.snapshot.userId);
  }
  async function signOut() {
    if (queue.current.length)
      throw new Error('Synchronisez les cases en attente avant de vous déconnecter.');
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    if (current.current?.householdId !== 'demo' && current.current)
      await AsyncStorage.multiRemove([
        `miamatch.cache.${current.current.userId}`,
        queueKey(current.current),
      ]);
    await AsyncStorage.removeItem('miamatch.demo');
    demo.current = null;
    current.current = null;
    setSnapshot(null);
    setMode(null);
    setUserId(null);
    queue.current = [];
  }
  return (
    <State.Provider
      value={{
        snapshot,
        recipes,
        mode,
        ready,
        userId,
        error,
        pending,
        connected,
        dispatch,
        startDemo,
        switchPlayer,
        loadHousehold,
        refresh,
        signOut,
        clearError: () => setError(null),
        report,
      }}
    >
      {children}
    </State.Provider>
  );
}
export const useApp = () => useContext(State);
