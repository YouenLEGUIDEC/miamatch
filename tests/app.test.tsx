import { test, expect, jest, beforeEach } from '@jest/globals';
import { renderRouter, screen } from 'expo-router/testing-library';
import { fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Layout from '../app/_layout';
import TabLayout from '../app/(tabs)/_layout';
import Welcome from '../src/screens/Welcome';
import AuthCallback from '../src/screens/AuthCallback';
import Home from '../src/screens/Home';
import Preferences from '../src/screens/Preferences';
import Week from '../src/screens/Week';
import Deck from '../src/screens/Deck';
import Plan from '../src/screens/Plan';
import Shopping from '../src/screens/Shopping';
import Match from '../src/screens/Match';
import Crew from '../src/screens/Crew';
import RecipeDetail from '../src/screens/RecipeDetail';
import { Profile, Pantry, Favorites } from '../src/screens/Collections';
jest.mock('expo-crypto', () => ({ randomUUID: () => require('node:crypto').randomUUID() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@expo-google-fonts/bricolage-grotesque', () => ({
  useFonts: () => [true, null],
  BricolageGrotesque_700Bold: 1,
}));
jest.mock('@expo-google-fonts/manrope', () => ({ Manrope_500Medium: 1, Manrope_700Bold: 1 }));
beforeEach(async () => {
  await AsyncStorage.clear();
});
const routes = {
  _layout: Layout,
  '(tabs)/_layout': TabLayout,
  '(tabs)/index': Home,
  '(tabs)/plan': Plan,
  '(tabs)/shopping': Shopping,
  '(tabs)/profile': Profile,
  welcome: Welcome,
  'auth/callback': AuthCallback,
  preferences: Preferences,
  week: Week,
  deck: Deck,
  crew: Crew,
  pantry: Pantry,
  favorites: Favorites,
  'recipe/[id]': RecipeDetail,
  'match/[id]': Match,
};
test('connected screens: demo onboarding → five meals → generated courses → checked item', async () => {
  await renderRouter(routes, { initialUrl: '/welcome' });
  await screen.findByText('Explorer la démo');
  await fireEvent.changeText(screen.getByLabelText('Votre prénom'), 'Alice');
  await fireEvent.press(screen.getByText('Explorer la démo'));
  await screen.findByText('C’est tout moi');
  await fireEvent.press(screen.getByText('C’est tout moi'));
  await screen.findByText('Fais-moi swiper →');
  await fireEvent.press(screen.getByText('Prépare ma semaine'));
  await screen.findByText('Trouver nos 5 repas →');
  await fireEvent.press(screen.getByText('Trouver nos 5 repas →'));
  for (let n = 0; n < 5; n++) {
    await screen.findByText(`${n} / 5 repas choisis`);
    await fireEvent.press(screen.getByText('＋ Ce repas'));
  }
  await screen.findByText('Semaine bouclée 🎉');
  await fireEvent.press(screen.getByText('Voir ma semaine'));
  await screen.findByText('Générer ma liste de courses →');
  await fireEvent.press(screen.getByText('Générer ma liste de courses →'));
  await screen.findByLabelText('Article à ajouter');
  await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(5));
  await fireEvent.press(screen.getAllByRole('checkbox')[0]);
  await waitFor(() =>
    expect(screen.getAllByRole('checkbox')[0].props.accessibilityState.checked).toBe(true),
  );
  await fireEvent.changeText(screen.getByLabelText('Article à ajouter'), 'Éponge');
  await fireEvent.press(screen.getByText('＋ Ajouter à la liste'));
  await screen.findByText('Éponge');
  const saved = JSON.parse((await AsyncStorage.getItem('miamatch.demo'))!);
  expect(saved.snapshot.plan).toHaveLength(5);
  expect(new Set(saved.snapshot.plan.map((p: { id: string }) => p.id)).size).toBe(5);
  expect(saved.snapshot.shopping.some((i: { name: string }) => i.name === 'Éponge')).toBe(true);
}, 30000);

test('two separate same-phone votes open the Miamatch screen, not a fabricated match', async () => {
  const { initialDemo } = require('../src/state/demo');
  await AsyncStorage.setItem('miamatch.demo', JSON.stringify(initialDemo('Alice')));
  await renderRouter(routes, { initialUrl: '/deck' });
  await screen.findByText('Ça me tente →');
  await fireEvent.press(screen.getByText('Ça me tente →'));
  expect(screen.queryByText('IT’S A\nMIAMATCH !')).toBeNull();
  await fireEvent.press(screen.getByText('Passer le téléphone au second convive'));
  await screen.findByText(/Convive 2 ·/);
  await fireEvent.press(screen.getByText('Ça me tente →'));
  await screen.findByText('IT’S A\nMIAMATCH !');
  expect(JSON.parse((await AsyncStorage.getItem('miamatch.demo'))!).snapshot.matches.length).toBe(
    1,
  );
}, 15000);

test('cold-start invalid email callback stays visible before authentication', async () => {
  await renderRouter(routes, { initialUrl: '/auth/callback?error=access_denied' });
  await screen.findByText('Lien invalide ou expiré. Demandez un nouveau lien depuis la connexion.');
  expect(screen.queryByText('Explorer la démo')).toBeNull();
  await fireEvent.press(screen.getByText('Retour à la connexion'));
  await screen.findByText('Explorer la démo');
});
