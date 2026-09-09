import React from 'react';
import { router } from 'expo-router';
import { Button, Chip, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { ingredients } from '../data/catalog';
export function Pantry() {
  const app = useApp();
  const s = app.snapshot!;
  return (
    <Screen>
      <Title>Déjà chez nous.</Title>
      <Label muted>
        Les basiques du placard. Cochez ce que vous avez : on le mettra à part dans les courses.
        Pensez à vérifier les quantités disponibles.
      </Label>
      <Row>
        {ingredients.map((i) => (
          <Chip
            key={i.id}
            label={`${s.pantry.includes(i.id) ? '✓ ' : ''}${i.name}`}
            selected={s.pantry.includes(i.id)}
            onPress={() =>
              void app
                .dispatch({ type: 'pantry', ingredientId: i.id, value: !s.pantry.includes(i.id) })
                .catch(() => {})
            }
          />
        ))}
      </Row>
      <Button onPress={() => router.push('/shopping')}>Retour aux courses</Button>
    </Screen>
  );
}
export function Favorites() {
  const app = useApp();
  const favorites = app.recipes.filter((r) => app.snapshot!.favorites.includes(r.id));
  return (
    <Screen>
      <Title>Les grands oui.</Title>
      <Label muted>Vos coups de cœur, pour les soirs où vous savez déjà.</Label>
      {favorites.length ? (
        favorites.map((r) => (
          <Panel key={r.id}>
            <Heading>
              {r.emoji} {r.title}
            </Heading>
            <Label muted>
              {r.minutes} min · {r.subtitle}
            </Label>
            <Button
              secondary
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
            >
              Voir la fiche
            </Button>
          </Panel>
        ))
      ) : (
        <Panel>
          <Heading>Le premier coup de cœur arrive.</Heading>
          <Label>Appuyez sur le cœur d’une recette pour la retrouver ici.</Label>
          <Button onPress={() => router.push('/deck')}>Trouver mon prochain kiff</Button>
        </Panel>
      )}
    </Screen>
  );
}
export function Profile() {
  const app = useApp();
  return (
    <Screen>
      <Title>À votre sauce.</Title>
      <Heading>{app.snapshot!.members.find((m) => m.id === app.snapshot!.userId)?.name}</Heading>
      <Button secondary onPress={() => router.push('/preferences')}>
        Mes préférences alimentaires
      </Button>
      <Button secondary onPress={() => router.push('/crew')}>
        Gérer notre tablée
      </Button>
      <Button secondary onPress={() => router.push('/pantry')}>
        Notre garde-manger
      </Button>
      <Button secondary onPress={() => router.push('/favorites')}>
        Mes favoris
      </Button>
      <Panel>
        <Label>Version de développement · catalogue de démonstration.</Label>
        <Label muted>
          Le copilote IA et les recettes de production ne sont pas encore activés. Aucune donnée de
          démonstration ne constitue un conseil nutritionnel.
        </Label>
      </Panel>
      <Button
        onPress={() =>
          void app
            .signOut()
            .then(() => router.replace('/'))
            .catch(app.report)
        }
      >
        Se déconnecter
      </Button>
    </Screen>
  );
}
