import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Heading, Label, Panel, Screen, Title } from '../ui/kit';
import { useApp, uid } from '../state/AppProvider';
import { theme as t } from '../ui/theme';
export default function Shopping() {
  const app = useApp();
  const s = app.snapshot!;
  const [name, setName] = useState('');
  const active = s.shopping.filter((i) => !i.pantry);
  const aisles = [...new Set(active.map((i) => i.aisle))].sort();
  return (
    <Screen>
      <Title>On remplit{'\n'}le panier.</Title>
      <Label muted>
        {active.filter((i) => i.checked).length} / {active.length} articles cochés ·{' '}
        {app.mode === 'demo'
          ? 'sur ce téléphone'
          : app.pending
            ? `${app.pending} modification(s) en attente`
            : app.connected
              ? 'synchronisation active'
              : 'reconnexion en cours'}
      </Label>
      {!active.length && (
        <Panel>
          <Heading>Un panier tout léger.</Heading>
          <Label>
            Choisissez vos repas puis générez les courses, ou ajoutez un article ci-dessous.
          </Label>
          <Button secondary onPress={() => router.push('/plan')}>
            Voir ma semaine
          </Button>
        </Panel>
      )}
      {aisles.map((aisle) => (
        <View key={aisle} style={{ gap: 8 }}>
          <Heading>{aisle}</Heading>
          {active
            .filter((i) => i.aisle === aisle)
            .map((i) => (
              <Pressable
                key={i.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: i.checked }}
                accessibilityLabel={`${i.name}, ${i.quantity} ${i.unit}`}
                onPress={() =>
                  void app
                    .dispatch({ type: 'shopping-check', id: i.id, checked: !i.checked })
                    .catch(() => {})
                }
                style={{
                  minHeight: 60,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderColor: t.colors.line,
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, color: t.colors.ink }}>{i.checked ? '☑' : '□'}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: t.font.bold,
                      fontSize: 16,
                      color: i.checked ? t.colors.muted : t.colors.ink,
                      textDecorationLine: i.checked ? 'line-through' : 'none',
                    }}
                  >
                    {i.name}
                  </Text>
                  <Label muted>
                    {i.quantity} {i.unit === 'piece' ? 'pièce(s)' : i.unit}
                  </Label>
                </View>
              </Pressable>
            ))}
        </View>
      ))}
      {s.shopping.some((i) => i.pantry) && (
        <Panel>
          <Heading>Déjà chez nous</Heading>
          {s.shopping
            .filter((i) => i.pantry)
            .map((i) => (
              <Label key={i.id}>
                ✓ {i.name} · {i.quantity} {i.unit}
              </Label>
            ))}
          <Button secondary onPress={() => router.push('/pantry')}>
            Vérifier le garde-manger
          </Button>
        </Panel>
      )}
      <Field
        accessibilityLabel="Article à ajouter"
        placeholder="Café, éponge, petit plaisir…"
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <Button
        disabled={!name.trim()}
        onPress={() =>
          void app
            .dispatch({ type: 'shopping-add', id: uid(), name })
            .then(() => setName(''))
            .catch(() => {})
        }
      >
        ＋ Ajouter à la liste
      </Button>
      <Label muted>
        Après un changement du planning, régénérez les courses. Les cases des quantités inchangées
        et vos ajouts manuels sont conservés.
      </Label>
    </Screen>
  );
}
