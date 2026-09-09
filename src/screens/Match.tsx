import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Animated, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Label, Panel, Screen, Title } from '../ui/kit';
import { useApp, uid } from '../state/AppProvider';
import { theme as t } from '../ui/theme';
export default function Match() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useApp();
  const r = app.recipes.find((r) => r.id === id);
  const [scale] = useState(() => new Animated.Value(0.7));
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [scale]);
  if (!r || !app.snapshot!.matches.includes(id))
    return (
      <Screen>
        <Title>Pas encore de match.</Title>
        <Button onPress={() => router.replace('/deck')}>Continuer à swiper</Button>
      </Screen>
    );
  return (
    <Screen>
      <Panel style={{ backgroundColor: t.colors.coral, padding: 30, alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={{ fontSize: 100 }}>❤️</Text>
        </Animated.View>
        <Text
          style={{
            fontFamily: t.font.title,
            fontSize: 44,
            lineHeight: 46,
            color: t.colors.ink,
            textAlign: 'center',
          }}
        >
          IT’S A{'\n'}MIAMATCH !
        </Text>
      </Panel>
      <Title>{r.title}</Title>
      <Label>Vous avez tous envie de {r.title.toLowerCase()}. Ça mérite de passer à table.</Label>
      <Button
        onPress={() =>
          void app
            .dispatch({ type: 'plan-add', recipeId: id, id: uid() })
            .then(() => router.replace('/plan'))
            .catch(() => {})
        }
      >
        Ajouter à cette semaine
      </Button>
      <Button secondary onPress={() => router.push({ pathname: '/recipe/[id]', params: { id } })}>
        Voir la recette
      </Button>
      <Button secondary onPress={() => router.replace('/deck')}>
        Continuer à swiper
      </Button>
    </Screen>
  );
}
