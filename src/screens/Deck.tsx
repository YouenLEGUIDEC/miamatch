import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Button, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { RecipeCard } from '../ui/RecipeCard';
import { useApp, uid } from '../state/AppProvider';
import { deck } from '../domain/recommend';
import { Vote } from '../domain/model';
export default function Deck() {
  const app = useApp();
  const s = app.snapshot!;
  const { week } = useLocalSearchParams<{ week?: string }>();
  const [busy, setBusy] = useState(false);
  const [localSeen, setLocalSeen] = useState<string[]>([]);
  const candidates = useMemo(
    () =>
      deck(
        app.recipes,
        s.members.map((m) => m.preferences),
        s.mood,
        week ? Object.fromEntries(Object.entries(s.votes).filter(([, v]) => v === 'no')) : s.votes,
        s.favorites,
        week ? [...s.plan.map((p) => p.recipeId), ...localSeen] : [],
      ),
    [app.recipes, s, week, localSeen],
  );
  const r = candidates[0];
  useEffect(() => {
    candidates.slice(1, 4).forEach((r) => {
      if (r.image && r.source.canUseImage) void Image.prefetch(r.image).catch(() => {});
    });
  }, [candidates]);
  useEffect(() => {
    if (r && s.matches.includes(r.id) && !week)
      router.replace({ pathname: '/match/[id]', params: { id: r.id } });
  }, [s.matches, r, week]);
  async function vote(vote: Vote) {
    if (!r || busy) return;
    setBusy(true);
    try {
      await app.dispatch({ type: 'vote', recipeId: r.id, vote });
      if (week && vote !== 'no')
        await app.dispatch({ type: 'plan-add', recipeId: r.id, id: uid() });
      setLocalSeen((x) => [...x, r.id]);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
    } finally {
      setBusy(false);
    }
  }
  if (week && s.plan.length >= s.target)
    return (
      <Screen>
        <Title>Semaine bouclée 🎉</Title>
        <Label>{s.target} repas, une décision de moins chaque soir.</Label>
        <Button onPress={() => router.replace('/plan')}>Voir ma semaine</Button>
      </Screen>
    );
  return (
    <Screen>
      <Row>
        <Heading>
          {week
            ? `${s.plan.length} / ${s.target} repas choisis`
            : 'Le prochain coup de fourchette.'}
        </Heading>
      </Row>
      <Label muted>
        {s.members.find((m) => m.id === s.userId)?.name} · {candidates.length} idée
        {candidates.length > 1 ? 's' : ''} restante{candidates.length > 1 ? 's' : ''}
      </Label>
      {r ? (
        <>
          <RecipeCard
            recipe={r}
            disabled={busy}
            onOpen={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
            onVote={(v) => void vote(v)}
          />
          <Row>
            <Button secondary disabled={busy} onPress={() => void vote('no')}>
              ✕ Pas ce soir
            </Button>
            <Button secondary disabled={busy} onPress={() => void vote('love')}>
              ♥ Coup de cœur
            </Button>
            <Button disabled={busy} onPress={() => void vote('yes')}>
              {week ? '＋ Ce repas' : 'Ça me tente →'}
            </Button>
          </Row>
          <Label muted>Glissez à gauche pour passer, à droite pour dire oui.</Label>
        </>
      ) : (
        <Panel>
          <Title>On a fait le tour !</Title>
          <Label>
            Vos contraintes sont conservées. Retrouvez vos favoris ou ajustez le temps et les
            préférences pour découvrir plus d’idées.
          </Label>
          <Button onPress={() => router.push('/preferences')}>Ajuster mes préférences</Button>
          <Button secondary onPress={() => router.push('/favorites')}>
            Voir mes favoris
          </Button>
        </Panel>
      )}
      {app.mode === 'demo' && (
        <Button secondary onPress={() => void app.switchPlayer().catch(app.report)}>
          Passer le téléphone au second convive
        </Button>
      )}
      <Button secondary onPress={() => router.back()}>
        Retour
      </Button>
    </Screen>
  );
}
