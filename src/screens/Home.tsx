import React, { useState } from 'react';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Text, View } from 'react-native';
import { Button, Chip, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { deck, randomChoice } from '../domain/recommend';
import { theme as t } from '../ui/theme';
export default function Home() {
  const app = useApp();
  const s = app.snapshot!;
  const [mood, setMood] = useState(s.mood);
  const [busy, setBusy] = useState(false);
  async function begin(random = false) {
    setBusy(true);
    try {
      await app.dispatch({ type: 'mood', value: mood });
      if (random) {
        const r = randomChoice(
          deck(
            app.recipes,
            s.members.map((m) => m.preferences),
            mood,
            s.votes,
            s.favorites,
          ),
        );
        if (r) router.push({ pathname: '/recipe/[id]', params: { id: r.id } });
        else
          app.report(
            new Error(
              'Plus de recettes éligibles. Ajustez vos préférences ou explorez vos favoris.',
            ),
          );
      } else router.push('/deck');
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Label muted>LA TABLÉE · {s.householdName.toUpperCase()}</Label>
      <Title>
        On mange{'\n'}quoi ?<Text style={{ color: t.colors.coral }}> ✳</Text>
      </Title>
      <Label muted>Le plus dur, c’est de choisir.{'\n'}Alors autant s’amuser un peu.</Label>
      <Panel style={{ backgroundColor: t.colors.butter, padding: 24 }}>
        <Row>
          <Text style={{ fontSize: 42 }}>🥗</Text>
          <View style={{ flex: 1 }}>
            <Heading>
              {mood < 0.33
                ? 'Envie de fraîcheur'
                : mood > 0.66
                  ? 'On se fait un kiff ?'
                  : 'Le bon équilibre'}
            </Heading>
            <Label>Votre mood du moment</Label>
          </View>
          <Text style={{ fontSize: 42 }}>🍔</Text>
        </Row>
        <Slider
          accessibilityLabel="Mood healthy à gros kiff"
          minimumValue={0}
          maximumValue={1}
          value={mood}
          onValueChange={setMood}
          onSlidingComplete={(value) => void app.dispatch({ type: 'mood', value }).catch(() => {})}
          minimumTrackTintColor={t.colors.ink}
          maximumTrackTintColor="#D4B158"
          thumbTintColor={t.colors.ink}
          style={{ height: 44 }}
        />
        <Row>
          <Label>🥗 Healthy</Label>
          <View style={{ flex: 1 }} />
          <Label>Gros kiff 🍔</Label>
        </Row>
      </Panel>
      <Row>
        {[15, 30, 45].map((n) => (
          <Chip
            key={n}
            label={`${n} min max`}
            selected={s.preferences.maxMinutes === n}
            onPress={() =>
              void app
                .dispatch({ type: 'preferences', value: { ...s.preferences, maxMinutes: n } })
                .catch(() => {})
            }
          />
        ))}
        <Chip label="Mes préférences" onPress={() => router.push('/preferences')} />
      </Row>
      <Button disabled={busy} onPress={() => void begin()}>
        Fais-moi swiper →
      </Button>
      <Button secondary disabled={busy} onPress={() => void begin(true)}>
        🎲 J’ai la flemme
      </Button>
      <Panel>
        <Heading>Votre semaine, sans le casse-tête.</Heading>
        <Label muted>
          {s.plan.length} / {s.target} repas choisis · {s.servings} personnes
        </Label>
        <Button secondary onPress={() => router.push('/week')}>
          Prépare ma semaine
        </Button>
      </Panel>
      {s.matches.length > 0 && (
        <Panel style={{ backgroundColor: t.colors.pistachio }}>
          <Heading>
            {s.matches.length} envie{s.matches.length > 1 ? 's' : ''} en commun ❤️
          </Heading>
          {s.matches.map((id) => (
            <Button
              key={id}
              secondary
              onPress={() => router.push({ pathname: '/match/[id]', params: { id } })}
            >
              {app.recipes.find((r) => r.id === id)?.title ?? 'Voir le match'}
            </Button>
          ))}
        </Panel>
      )}
    </Screen>
  );
}
