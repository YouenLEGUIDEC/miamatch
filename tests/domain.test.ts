import { test, expect } from '@jest/globals';
import { defaultPreferences, Recipe } from '../src/domain/model';
import { recipes } from '../src/data/catalog';
import { deck, eligible, randomChoice, score } from '../src/domain/recommend';
import { aggregate } from '../src/domain/shopping';
import { isMatch, reduce } from '../src/domain/reducer';
import { demoAction, initialDemo, switchDemo } from '../src/state/demo';
const p = defaultPreferences;
test('allergy exclusions take priority even at maximum indulgence', () => {
  const prefs = { ...p, allergies: ['milk', 'sesame', 'soy', 'egg', 'peanut', 'gluten', 'fish'] };
  for (const r of deck(recipes, [prefs], 1, {}, [])) {
    expect(r.ingredients.flatMap((i) => i.allergens).some((a) => prefs.allergies.includes(a))).toBe(
      false,
    );
  }
});
test('unknown allergen coverage fails closed', () => {
  expect(
    eligible({ ...recipes[0], allergensVerified: false }, [{ ...p, allergies: ['nuts'] }]),
  ).toBe(false);
});
test('crew constraints are intersected', () => {
  expect(eligible(recipes[0], [p, { ...p, diet: 'vegan' }])).toBe(false);
  expect(
    deck(recipes, [p, { ...p, diet: 'vegan' }], 0.5, {}, []).every((r) =>
      r.diets.includes('vegan'),
    ),
  ).toBe(true);
});
test('equipment, time and excluded ingredients are hard filters', () => {
  expect(eligible(recipes[0], [{ ...p, equipment: [] }])).toBe(false);
  expect(eligible(recipes[0], [{ ...p, maxMinutes: 15 }])).toBe(false);
  expect(eligible(recipes[0], [{ ...p, excluded: ['chicken'] }])).toBe(false);
});
test('mood changes ranking and results are deterministic', () => {
  expect(score(recipes[0], recipes[0].mood, p, []).total).toBeGreaterThan(
    score(recipes[0], 0, p, []).total,
  );
  expect(deck(recipes, [p], 0, {}, [])[0].id).not.toBe(deck(recipes, [p], 1, {}, [])[0].id);
  expect(deck(recipes, [p], 0.5, {}, [])).toEqual(deck(recipes, [p], 0.5, {}, []));
});
test('rejects and selected meals never return through exploration', () => {
  const votes = Object.fromEntries(recipes.slice(0, 8).map((r) => [r.id, 'no' as const]));
  expect(
    deck(recipes, [p], 0.5, votes, [], [recipes[8].id]).every(
      (r) => !votes[r.id] && r.id !== recipes[8].id,
    ),
  ).toBe(true);
});
test('random handles empty deck and stays in top candidates', () => {
  expect(randomChoice([])).toBeUndefined();
  expect(randomChoice(recipes, () => 1)).toBe(recipes[4]);
});
test('compatible quantities aggregate and scale per serving', () => {
  const a = {
    ...recipes[0],
    ingredients: [{ ...recipes[0].ingredients[0], quantity: 200 }],
  } as Recipe;
  const b = {
    ...recipes[1],
    ingredients: [{ ...recipes[0].ingredients[0], quantity: 0.35, unit: 'kg' as const }],
  };
  const result = aggregate(
    [
      { id: 'a', recipeId: a.id, servings: 2, day: null },
      { id: 'b', recipeId: b.id, servings: 2, day: null },
    ],
    [a, b],
    [],
  );
  expect(result[0].quantity).toBe(550);
  expect(
    aggregate([{ id: 'a', recipeId: a.id, servings: 4, day: null }], [a], [])[0].quantity,
  ).toBe(400);
});
test('volume and mass never merged, pantry marks only exact ingredients', () => {
  const r = {
    ...recipes[0],
    ingredients: [
      { ...recipes[0].ingredients[0], unit: 'g' as const },
      { ...recipes[0].ingredients[0], unit: 'ml' as const },
    ],
  };
  const list = aggregate([{ id: 'a', recipeId: r.id, servings: 2, day: null }], [r], ['chicken']);
  expect(list).toHaveLength(2);
  expect(list.every((i) => i.pantry)).toBe(true);
});
test('regeneration preserves manual items and resets checked changed quantities', () => {
  const plan = [{ id: 'a', recipeId: recipes[0].id, servings: 2, day: null }];
  const list = aggregate(plan, recipes, []).map((i) => ({ ...i, checked: true }));
  expect(aggregate(plan, recipes, [], list).every((i) => i.checked)).toBe(true);
  expect(aggregate([{ ...plan[0], servings: 4 }], recipes, [], list).every((i) => !i.checked)).toBe(
    true,
  );
});
test('match requires all real participants, never one voter', () => {
  expect(isMatch(['a'], { a: 'yes' })).toBe(false);
  expect(isMatch(['a', 'b'], { a: 'yes' })).toBe(false);
  expect(isMatch(['a', 'b'], { a: 'love', b: 'yes' })).toBe(true);
  expect(isMatch(['a', 'b', 'c'], { a: 'love', b: 'yes', c: 'no' })).toBe(false);
});
test('same-phone votes stay private and generate a real shared match', () => {
  let d = initialDemo('Alice');
  d = demoAction(d, { type: 'vote', recipeId: recipes[0].id, vote: 'yes' });
  expect(d.snapshot.matches).toEqual([]);
  d = switchDemo(d);
  expect(d.snapshot.votes).toEqual({});
  d = demoAction(d, { type: 'vote', recipeId: recipes[0].id, vote: 'love' });
  expect(d.snapshot.matches).toContain(recipes[0].id);
  d = switchDemo(d);
  expect(d.snapshot.votes[recipes[0].id]).toBe('yes');
});
test('full local vertical slice reaches 5 meals and checks aggregated groceries', () => {
  let s = initialDemo('Test').snapshot;
  for (const r of recipes.slice(0, 5))
    s = reduce(s, { type: 'plan-add', recipeId: r.id, id: r.id }, recipes);
  expect(s.plan).toHaveLength(5);
  s = reduce(s, { type: 'shopping-generate' }, recipes);
  expect(s.shopping.length).toBeGreaterThan(5);
  const id = s.shopping[0].id;
  s = reduce(s, { type: 'shopping-check', id, checked: true }, recipes);
  s = reduce(s, { type: 'shopping-check', id, checked: true }, recipes);
  expect(s.shopping[0].checked).toBe(true);
});
test('invalid plan servings rejected', () => {
  expect(() =>
    reduce(initialDemo('A').snapshot, { type: 'week', target: 5, servings: 0 }, recipes),
  ).toThrow();
});
