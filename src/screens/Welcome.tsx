import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Field, Label, Panel, Screen, Title } from '../ui/kit';
import { useApp } from '../state/AppProvider';
import { supabase, rpc } from '../data/supabase';
import { theme as t } from '../ui/theme';
export default function Welcome() {
  const app = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      throw new Error('Saisissez une adresse email valide.');
    const { error } = await supabase!.auth.signInWithOtp({ email: email.trim() });
    if (error) throw error;
    setSent(true);
  }
  async function verify() {
    const { error } = await supabase!.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    if (error) throw error;
    await rpc('setup_profile', { display_name: name.trim() || 'Convive' });
    const { data: member, error: memberError } = await supabase!
      .from('household_members')
      .select('household_id')
      .eq('user_id', (await supabase!.auth.getUser()).data.user!.id)
      .maybeSingle();
    if (memberError) throw memberError;
    if (member) {
      await app.loadHousehold(member.household_id);
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
          <Label>Se connecter par code email</Label>
          <Field
            accessibilityLabel="Adresse email"
            placeholder="vous@exemple.fr"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {sent && (
            <Field
              accessibilityLabel="Code de connexion"
              placeholder="Code reçu par email"
              keyboardType="number-pad"
              value={token}
              onChangeText={setToken}
            />
          )}
          <Button disabled={busy} onPress={() => void run(sent ? verify : send)}>
            {busy ? 'Un instant…' : sent ? 'Confirmer mon code' : 'Recevoir mon code'}
          </Button>
          {sent && (
            <Button secondary onPress={() => setSent(false)}>
              Changer d’adresse / renvoyer
            </Button>
          )}
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
