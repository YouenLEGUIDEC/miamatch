import React, { useEffect, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/state/AppProvider';
import { Loading } from '../src/ui/kit';
import { theme } from '../src/ui/theme';
export { ErrorBoundary } from 'expo-router';
function Navigation() {
  const app = useApp();
  const previous = useRef<string[] | null>(null);
  useEffect(() => {
    if (!app.snapshot) {
      previous.current = null;
      return;
    }
    const fresh =
      previous.current === null
        ? undefined
        : app.snapshot.matches.find((id) => !previous.current!.includes(id));
    previous.current = app.snapshot.matches;
    if (fresh) router.push({ pathname: '/match/[id]', params: { id: fresh } });
  }, [app.snapshot]);
  const segments = useSegments();
  const root = segments[0];
  useEffect(() => {
    if (!app.ready) return;
    if (!app.userId && root !== 'welcome') router.replace('/welcome');
    else if (app.userId && !app.snapshot && root !== 'crew' && root !== 'welcome')
      router.replace('/crew');
    else if (app.snapshot && root === 'welcome') router.replace('/');
  }, [app.ready, app.userId, app.snapshot, root]);
  if (!app.ready || (!app.snapshot && root !== 'welcome' && root !== 'crew')) return <Loading />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.cream } }}
    />
  );
}
export default function Layout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    Manrope_500Medium,
    Manrope_700Bold,
  });
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
