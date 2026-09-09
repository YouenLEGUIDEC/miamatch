import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { Button, Field, Heading, Label, Panel, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { rpc } from '../data/supabase';
export default function Crew() {
  const app = useApp();
  const params = useLocalSearchParams<{ code?: string }>();
  const [name, setName] = useState('La tablée');
  const [code, setCode] = useState(params.code ?? '');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      app.report(e);
    } finally {
      setBusy(false);
    }
  }
  async function create(join: boolean) {
    const h = await rpc<string>(
      join ? 'join_household' : 'create_household',
      join ? { invite_code: code } : { display_name: name },
    );
    await app.loadHousehold(h);
    router.replace('/preferences');
  }
  return (
    <Screen>
      <Title>{app.snapshot ? 'Notre tablée.' : 'Meilleur ensemble.'}</Title>
      {app.snapshot ? (
        <>
          <Label muted>
            {app.snapshot.householdName} · {app.snapshot.members.length} membre(s)
          </Label>
          {app.snapshot.members.map((m) => (
            <Panel key={m.id}>
              <Heading>
                {m.id === app.snapshot!.userId ? '● ' : ''}
                {m.name}
              </Heading>
              <Label muted>
                {m.id === app.snapshot!.userId ? 'C’est vous' : 'Membre de la tablée'}
              </Label>
            </Panel>
          ))}
          {app.mode === 'demo' ? (
            <>
              <Button onPress={() => void app.switchPlayer().catch(app.report)}>
                Passer au second convive
              </Button>
              <Label muted>
                Mode même téléphone : chaque convive vote à son tour. Aucune synchronisation entre
                téléphones dans cette démo.
              </Label>
            </>
          ) : (
            <>
              <Button
                disabled={busy}
                onPress={() =>
                  void run(async () =>
                    setInvite(await rpc<string>('invite_member', { h: app.snapshot!.householdId })),
                  )
                }
              >
                Créer un code d’invitation
              </Button>
              {invite && (
                <Panel>
                  <Heading>{invite}</Heading>
                  <Label>Valable 48 heures, utilisable une seule fois.</Label>
                  <Button
                    secondary
                    onPress={() =>
                      void Share.share({
                        message: `Rejoins notre tablée Miamatch ! Code : ${invite}\nmiamatch://crew?code=${invite}`,
                      }).catch(app.report)
                    }
                  >
                    Partager l’invitation
                  </Button>
                </Panel>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Label muted>
            Un foyer pour vous, vos colocs, vos proches. Chacun garde ses envies ; on trouve celles
            qui se rencontrent.
          </Label>
          <Field
            accessibilityLabel="Nom du foyer"
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <Button disabled={busy || !name.trim()} onPress={() => void run(() => create(false))}>
            Créer notre tablée
          </Button>
          <Heading>Déjà invité ?</Heading>
          <Field
            accessibilityLabel="Code d’invitation"
            placeholder="Code de 12 caractères"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={12}
          />
          <Button
            secondary
            disabled={busy || code.length !== 12}
            onPress={() => void run(() => create(true))}
          >
            Rejoindre avec ce code
          </Button>
        </>
      )}
      <Button secondary onPress={() => router.replace('/')}>
        Retour à l’accueil
      </Button>
    </Screen>
  );
}
