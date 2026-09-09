import React from 'react';
import { router } from 'expo-router';
import { Button, Chip, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export default function Plan() {
  const app = useApp();
  const s = app.snapshot!;
  return (
    <Screen>
      <Title>{s.plan.length >= s.target ? 'Semaine bouclée 🎉' : 'La semaine prend goût.'}</Title>
      <Label muted>
        {s.plan.length} / {s.target} repas choisis
      </Label>
      {!s.plan.length && (
        <Panel>
          <Heading>La table est encore libre.</Heading>
          <Label>Quelques swipes et le dîner sera déjà décidé.</Label>
        </Panel>
      )}
      {s.plan.map((p, index) => {
        const r = app.recipes.find((r) => r.id === p.recipeId);
        return (
          <Panel key={p.id}>
            <Label muted>
              {p.day ?? `REPAS ${index + 1}`} · {p.servings} PERSONNES
            </Label>
            <Heading>
              {r?.emoji} {r?.title ?? 'Recette indisponible'}
            </Heading>
            <Row>
              <Chip
                label="Voir"
                onPress={() =>
                  router.push({ pathname: '/recipe/[id]', params: { id: p.recipeId } })
                }
              />
              <Chip
                label="↑"
                onPress={() =>
                  void app.dispatch({ type: 'plan-move', id: p.id, direction: -1 }).catch(() => {})
                }
              />
              <Chip
                label="↓"
                onPress={() =>
                  void app.dispatch({ type: 'plan-move', id: p.id, direction: 1 }).catch(() => {})
                }
              />
              <Chip
                label="Retirer / remplacer"
                onPress={() => void app.dispatch({ type: 'plan-remove', id: p.id }).catch(() => {})}
              />
            </Row>
            <Row>
              {days.map((day) => (
                <Chip
                  key={day}
                  label={day.slice(0, 3)}
                  selected={p.day === day}
                  onPress={() =>
                    void app
                      .dispatch({ type: 'plan-day', id: p.id, day: p.day === day ? null : day })
                      .catch(() => {})
                  }
                />
              ))}
            </Row>
          </Panel>
        );
      })}
      <Button
        disabled={!s.plan.length}
        onPress={() =>
          void app
            .dispatch({ type: 'shopping-generate' })
            .then(() => router.push('/shopping'))
            .catch(() => {})
        }
      >
        Générer ma liste de courses →
      </Button>
      <Button secondary onPress={() => router.push({ pathname: '/deck', params: { week: '1' } })}>
        Choisir d’autres repas
      </Button>
      <Button secondary onPress={() => router.push('/week')}>
        Régler ma semaine
      </Button>
    </Screen>
  );
}
