import React, { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Recipe, Vote } from '../domain/model';
import { theme as t } from './theme';
import { Label } from './kit';
export function RecipeArt({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  if (recipe.image && recipe.source.canUseImage)
    return (
      <Image
        source={recipe.image}
        style={{ height: compact ? 110 : 320, width: '100%' }}
        contentFit="cover"
        transition={150}
      />
    );
  return (
    <View style={[s.art, { backgroundColor: recipe.color, height: compact ? 110 : 290 }]}>
      <View style={[s.ring, compact && { width: 95, height: 95, borderWidth: 10 }]}>
        <Text style={{ fontSize: compact ? 50 : 126 }}>{recipe.emoji}</Text>
      </View>
      {!compact && <Text style={s.sticker}>LE BONHEUR{'\n'}EST À TABLE.</Text>}
    </View>
  );
}
export function RecipeCard({
  recipe,
  onOpen,
  onVote,
  disabled,
}: {
  recipe: Recipe;
  onOpen: () => void;
  onVote?: (vote: Vote) => void;
  disabled?: boolean;
}) {
  const [xy] = useState(() => new Animated.ValueXY());
  useEffect(() => xy.setValue({ x: 0, y: 0 }), [recipe.id, xy]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          !!onVote && !disabled && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => xy.setValue({ x: g.dx, y: g.dy * 0.15 }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 90) {
            void Haptics.selectionAsync().catch(() => {});
            onVote?.(g.dx > 0 ? 'yes' : 'no');
          }
          Animated.spring(xy, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        },
      }),
    [disabled, onVote, xy],
  );
  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        s.card,
        {
          transform: [
            ...xy.getTranslateTransform(),
            {
              rotate: xy.x.interpolate({
                inputRange: [-300, 300],
                outputRange: ['-12deg', '12deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Voir ${recipe.title}`}
        onPress={onOpen}
      >
        <RecipeArt recipe={recipe} />
        <View style={s.content}>
          <View style={s.top}>
            <Text style={s.category}>
              {recipe.family.toUpperCase()} · {recipe.minutes} MIN
            </Text>
            <Text style={s.fixture}>
              {recipe.source.kind === 'fixture' ? 'FICHE DÉMO' : 'RECETTE'}
            </Text>
          </View>
          <Text style={s.title}>{recipe.title}</Text>
          <Label muted>{recipe.subtitle}</Label>
          <Text style={s.nutrition}>
            {recipe.nutrition.calories
              ? `${recipe.nutrition.calories.value} kcal`
              : 'Nutrition non renseignée'}
            {recipe.nutrition.protein ? ` · ${recipe.nutrition.protein.value} g prot.` : ''}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  card: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#FFFDFA',
    borderWidth: 1,
    borderColor: t.colors.line,
  },
  art: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: {
    height: 245,
    width: 245,
    borderRadius: 180,
    borderWidth: 20,
    borderColor: '#FFF7EC',
    backgroundColor: '#F5EDD9',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-9deg' }],
  },
  sticker: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: t.colors.ink,
    color: t.colors.cream,
    fontFamily: t.font.bold,
    fontSize: 11,
    padding: 13,
    borderRadius: 50,
    transform: [{ rotate: '9deg' }],
    textAlign: 'center',
  },
  content: { padding: 22, gap: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  category: { fontSize: 10, fontFamily: t.font.bold, color: t.colors.muted, letterSpacing: 1.3 },
  fixture: { fontSize: 9, fontFamily: t.font.bold, color: t.colors.coralDark },
  title: {
    fontFamily: t.font.title,
    fontSize: 29,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: t.colors.ink,
  },
  nutrition: { fontFamily: t.font.body, fontSize: 12, color: t.colors.muted, marginTop: 5 },
});
