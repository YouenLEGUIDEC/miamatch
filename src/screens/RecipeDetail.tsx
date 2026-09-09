import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { useApp, uid } from '../state/AppProvider';
import { Button, Chip, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { RecipeArt } from '../ui/RecipeCard';
import { eligible } from '../domain/recommend';
export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useApp();
  const s = app.snapshot!;
  const r = app.recipes.find((r) => r.id === id);
  const [portions, setPortions] = useState(s.servings);
  const [added, setAdded] = useState(false);
  if (!r)
    return (
      <Screen>
        <Title>Recette introuvable</Title>
        <Button onPress={() => router.back()}>Retour</Button>
      </Screen>
    );
  const allowed = eligible(
    r,
    s.members.map((m) => m.preferences),
  );
  const planned = s.plan.some((p) => p.recipeId === id);
  return (
    <Screen>
      <Button secondary onPress={() => router.back()}>
        ← Retour
      </Button>
      <RecipeArt recipe={r} />
      <Title>{r.title}</Title>
      <Label>{r.subtitle}</Label>
      <Label muted>
        {r.minutes} minutes · {r.source.author}
      </Label>
      {r.source.kind === 'fixture' && (
        <Panel>
          <Heading>Fiche de démonstration</Heading>
          <Label>
            Les ingrédients et quantités servent à tester l’application. Cette fiche n’a pas été
            testée en cuisine et ne propose pas d’instructions validées.
          </Label>
        </Panel>
      )}
      {!allowed && (
        <Panel>
          <Label>
            Cette fiche ne correspond plus aux contraintes actuelles du foyer. Elle ne peut pas être
            ajoutée au planning.
          </Label>
        </Panel>
      )}
      <Row>
        <Chip label="−" onPress={() => setPortions(Math.max(1, portions - 1))} />
        <Label>{portions} personnes</Label>
        <Chip label="＋" onPress={() => setPortions(Math.min(12, portions + 1))} />
      </Row>
      <Heading>Dans le panier</Heading>
      {r.ingredients.map((i) => (
        <Row key={i.id}>
          <Label>{i.name}</Label>
          <Label muted>
            {Math.round(((i.quantity * portions) / r.servings) * 100) / 100}{' '}
            {i.unit === 'piece' ? 'pièce(s)' : i.unit}
          </Label>
        </Row>
      ))}
      <Heading>Nutrition par portion</Heading>
      {Object.keys(r.nutrition).length ? (
        Object.entries(r.nutrition).map(([key, n]) => (
          <Panel key={key}>
            <Label>
              {key} · {n.value} {n.unit}
            </Label>
            <Label muted>
              {n.source} · {n.method} · {n.reference} · confiance {n.confidence}
            </Label>
          </Panel>
        ))
      ) : (
        <Label muted>Non renseignée. Aucune valeur estimée ou inventée.</Label>
      )}
      <Heading>En cuisine</Heading>
      {r.source.canDisplayInstructions && r.steps.length ? (
        r.steps.map((step, i) => (
          <Label key={i}>
            {i + 1}. {step}
          </Label>
        ))
      ) : (
        <Label muted>
          {r.source.url
            ? 'Les instructions sont disponibles auprès de l’auteur original.'
            : 'Les instructions arriveront avec le catalogue de recettes validées.'}
        </Label>
      )}
      {r.source.url && (
        <Button secondary onPress={() => void Linking.openURL(r.source.url!).catch(app.report)}>
          Ouvrir la recette originale ↗
        </Button>
      )}
      <Label muted>
        Provenance : {r.source.author}
        {'\n'}Droits : {r.source.license}
        {'\n'}Mise à jour : {r.source.fetchedAt}
      </Label>
      <Button
        secondary
        onPress={() =>
          void app
            .dispatch({ type: 'favorite', recipeId: id, value: !s.favorites.includes(id) })
            .catch(() => {})
        }
      >
        {s.favorites.includes(id) ? '♥ Retirer des favoris' : '♡ Garder en favori'}
      </Button>
      <Button
        disabled={!allowed || planned || s.plan.length >= s.target}
        onPress={() =>
          void app
            .dispatch({ type: 'plan-add', recipeId: id, id: uid() })
            .then(() => setAdded(true))
            .catch(() => {})
        }
      >
        {planned || added
          ? 'Ajouté à cette semaine ✓'
          : `Ajouter à cette semaine · ${s.servings} personnes`}
      </Button>
      <Label muted>
        Le sélecteur de portions ajuste la fiche. Le planning utilise le nombre de personnes choisi
        pour la semaine.
      </Label>
      <Button secondary onPress={() => router.push('/plan')}>
        Voir ma semaine
      </Button>
    </Screen>
  );
}
