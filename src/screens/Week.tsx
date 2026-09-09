import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Chip, Heading, Label, Panel, Row, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
export default function Week() {
  const app = useApp();
  const s = app.snapshot!;
  const [target, setTarget] = useState(s.target);
  const [servings, setServings] = useState(s.servings);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Title>Une semaine{'\n'}à croquer.</Title>
      <Label muted>
        Choisissez le nombre de repas. On s’occupe des idées, vous gardez le dernier mot.
      </Label>
      <Heading>Combien de repas ?</Heading>
      <Row>
        {[3, 5, 7, 10, 14].map((n) => (
          <Chip key={n} label={`${n} repas`} selected={n === target} onPress={() => setTarget(n)} />
        ))}
      </Row>
      <Heading>Combien à table ?</Heading>
      <Row>
        <Chip label="−" onPress={() => setServings(Math.max(1, servings - 1))} />
        <Label>{servings} personnes</Label>
        <Chip label="＋" onPress={() => setServings(Math.min(12, servings + 1))} />
      </Row>
      <Panel>
        <Label>
          Les contraintes de chaque membre sont respectées. Le mood et le temps de cuisine viennent
          de l’accueil.
        </Label>
        <Label muted>
          Les repas déjà choisis conservent leurs portions. Retirez puis ajoutez un repas pour les
          modifier.
        </Label>
      </Panel>
      <Button
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void app
            .dispatch({ type: 'week', target, servings })
            .then(() => router.push({ pathname: '/deck', params: { week: '1' } }))
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      >
        Trouver nos {target} repas →
      </Button>
      <Button secondary onPress={() => router.push('/plan')}>
        Voir le planning actuel
      </Button>
    </Screen>
  );
}
