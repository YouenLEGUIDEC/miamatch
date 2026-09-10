import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Field, Label, Panel, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { supabase } from '../data/supabase';
import * as Linking from 'expo-linking';
import { sendEmailLink, finishEmailLogin } from '../data/emailAuth';
import { theme as t } from '../ui/theme';
export default function Welcome() {
  const app = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
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
  async function send() {
    await sendEmailLink(email, name, Linking.createURL('auth/callback'));
    setSent(true);
  }
  async function resume() {
    const household = await finishEmailLogin();
    if (household) {
      await app.loadHousehold(household);
      router.replace('/');
    } else router.replace('/crew');
  }
  return (
    <Screen>
      <View
        style={{
          backgroundColor: t.colors.butter,
          borderRadius: 32,
          padding: 30,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 90 }}>🍝</Text>
        <Text style={{ fontFamily: t.font.title, fontSize: 24, color: t.colors.ink }}>
          Moins d’hésitation.{'\n'}Plus de bonnes tablées.
        </Text>
      </View>
      <Title>Et si on mangeait{'\n'}la même envie ?</Title>
      <Label muted>
        Des idées à swiper. Des envies qui se rencontrent. Une semaine et des courses qui se
        préparent ensemble.
      </Label>
      <Field
        accessibilityLabel="Votre prénom"
        placeholder="Votre prénom"
        value={name}
        onChangeText={setName}
        maxLength={60}
      />
      {supabase ? (
        <Panel>
          <Label>Se connecter par email</Label>
          <Field
            accessibilityLabel="Adresse email"
            placeholder="vous@exemple.fr"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {sent && (
            <Label>
              Ouvrez l’email sur ce téléphone et touchez « Sign in » ou « Confirm your mail ».
              Revenez ensuite dans Miamatch. Utilisez le dernier lien reçu.
            </Label>
          )}
          <Button disabled={busy} onPress={() => void run(app.userId ? resume : send)}>
            {busy
              ? 'Un instant…'
              : app.userId
                ? 'Continuer ma connexion'
                : sent
                  ? 'Recevoir un nouveau lien'
                  : 'Recevoir mon lien'}
          </Button>
          <Label muted>Pour cet essai, utilisez l’adresse de votre compte Supabase.</Label>
        </Panel>
      ) : (
        <Label muted>
          La connexion à deux téléphones sera disponible après le raccordement à Supabase.
        </Label>
      )}
      <Button
        secondary
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await app.startDemo(name);
            router.replace('/preferences');
          })
        }
      >
        Explorer la démo
      </Button>
      <Label muted>
        Démo locale : données de test, sans compte. Les fiches ne sont pas encore validées pour
        cuisiner.
      </Label>
    </Screen>
  );
}
