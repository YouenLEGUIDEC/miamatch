import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Chip, Heading, Label, Row, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { Diet, Preferences as Pref } from '../domain/model';
import { ingredients } from '../data/catalog';
const allergies = [
  ['milk', 'Lait'],
  ['egg', 'Œufs'],
  ['gluten', 'Gluten'],
  ['peanut', 'Arachides'],
  ['nuts', 'Fruits à coque'],
  ['fish', 'Poisson'],
  ['crustacean', 'Crustacés'],
  ['mollusc', 'Mollusques'],
  ['soy', 'Soja'],
  ['sesame', 'Sésame'],
  ['mustard', 'Moutarde'],
  ['celery', 'Céleri'],
  ['lupin', 'Lupin'],
  ['sulphites', 'Sulfites'],
];
export default function Preferences() {
  const app = useApp();
  const [p, setP] = useState<Pref>(app.snapshot!.preferences);
  const [busy, setBusy] = useState(false);
  function toggle(key: 'allergies' | 'excluded' | 'liked' | 'equipment', value: string) {
    setP({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((x) => x !== value) : [...p[key], value],
    });
  }
  return (
    <Screen>
      <Title>À votre goût.</Title>
      <Label muted>
        Quelques choix pour faire de la place aux bonnes envies. Vos préférences seront partagées
        avec les membres de votre foyer pour choisir ensemble.
      </Label>
      <Heading>À votre table</Heading>
      <Row>
        {(
          [
            ['omnivore', 'De tout'],
            ['vegetarian', 'Végétarien'],
            ['vegan', 'Végan'],
            ['no-pork', 'Sans porc'],
          ] as [Diet, string][]
        ).map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            selected={p.diet === id}
            onPress={() => setP({ ...p, diet: id })}
          />
        ))}
      </Row>
      <Heading>Allergies & intolérances</Heading>
      <Label muted>
        Les recettes incompatibles sont exclues. Vérifiez toujours les ingrédients et les étiquettes
        : aucune garantie d’absence de traces.
      </Label>
      <Row>
        {allergies.map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            selected={p.allergies.includes(id)}
            onPress={() => toggle('allergies', id)}
          />
        ))}
      </Row>
      <Heading>Pas dans mon assiette</Heading>
      <Row>
        {ingredients.map((i) => (
          <Chip
            key={i.id}
            label={i.name}
            selected={p.excluded.includes(i.id)}
            onPress={() => toggle('excluded', i.id)}
          />
        ))}
      </Row>
      <Heading>Mes ingrédients favoris</Heading>
      <Row>
        {ingredients.map((i) => (
          <Chip
            key={i.id}
            label={i.name}
            selected={p.liked.includes(i.id)}
            onPress={() => toggle('liked', i.id)}
          />
        ))}
      </Row>
      <Heading>Le temps qu’on a</Heading>
      <Row>
        {[15, 20, 30, 45, 60].map((n) => (
          <Chip
            key={n}
            label={`${n} min`}
            selected={p.maxMinutes === n}
            onPress={() => setP({ ...p, maxMinutes: n })}
          />
        ))}
      </Row>
      <Heading>Budget approximatif</Heading>
      <Row>
        {[1, 2, 3].map((n) => (
          <Chip
            key={n}
            label={['Petit budget', 'Modéré', 'Flexible'][n - 1]}
            selected={p.budget === n}
            onPress={() => setP({ ...p, budget: n })}
          />
        ))}
      </Row>
      <Heading>En cuisine</Heading>
      <Row>
        {[1, 2, 3].map((n) => (
          <Chip
            key={n}
            label={['Débutant', 'À l’aise', 'Passionné'][n - 1]}
            selected={p.skill === n}
            onPress={() => setP({ ...p, skill: n })}
          />
        ))}
      </Row>
      <Heading>Vos équipements</Heading>
      <Row>
        {[
          ['hob', 'Plaques'],
          ['oven', 'Four'],
          ['air-fryer', 'Air Fryer'],
          ['blender', 'Mixeur'],
        ].map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            selected={p.equipment.includes(id)}
            onPress={() => toggle('equipment', id)}
          />
        ))}
      </Row>
      <Chip
        label="Privilégier les protéines quand les données existent"
        selected={p.proteinFocus}
        onPress={() => setP({ ...p, proteinFocus: !p.proteinFocus })}
      />
      <Button
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void app
            .dispatch({ type: 'preferences', value: p })
            .then(() => router.replace('/'))
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      >
        C’est tout moi
      </Button>
    </Screen>
  );
}
