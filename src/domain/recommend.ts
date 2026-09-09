import { Preferences, Recipe, Vote } from './model';
export function eligible(recipe: Recipe, preferences: Preferences[]): boolean {
  return preferences.every(
    (p) =>
      recipe.minutes <= p.maxMinutes &&
      recipe.budget <= p.budget &&
      recipe.skill <= p.skill &&
      recipe.equipment.every((e) => p.equipment.includes(e)) &&
      (p.diet === 'omnivore' || recipe.diets.includes(p.diet)) &&
      !recipe.ingredients.some((i) => p.excluded.includes(i.id)) &&
      (p.allergies.length === 0 ||
        (recipe.allergensVerified &&
          !recipe.ingredients.some((i) => i.allergens.some((a) => p.allergies.includes(a))))),
  );
}
export function score(recipe: Recipe, mood: number, p: Preferences, favorites: string[]) {
  const reasons = {
    mood: 50 * (1 - Math.abs(recipe.mood - mood)),
    speed: 10 * (1 - recipe.minutes / 90),
    ingredients: Math.min(15, recipe.ingredients.filter((i) => p.liked.includes(i.id)).length * 5),
    favorite: favorites.includes(recipe.id) ? 10 : 0,
    protein:
      p.proteinFocus && recipe.nutrition.protein
        ? Math.min(10, recipe.nutrition.protein.value / 5)
        : 0,
    rating:
      recipe.rating && recipe.ratingCount
        ? recipe.rating * Math.min(1, recipe.ratingCount / 20)
        : 0,
  };
  return { total: Object.values(reasons).reduce((a, b) => a + b, 0), reasons };
}
export function deck(
  recipes: Recipe[],
  preferences: Preferences[],
  mood: number,
  votes: Record<string, Vote>,
  favorites: string[],
  selected: string[] = [],
) {
  const remaining = recipes.filter(
    (r) => eligible(r, preferences) && !votes[r.id] && !selected.includes(r.id),
  );
  const result: Recipe[] = [];
  while (remaining.length) {
    remaining.sort((a, b) => {
      const value = (r: Recipe) =>
        score(r, mood, preferences[0], favorites).total -
        18 * result.slice(-2).filter((s) => s.family === r.family).length;
      return value(b) - value(a) || a.id.localeCompare(b.id);
    });
    // Deterministic exploration, strictly within the eligible candidates.
    const index = result.length % 5 === 4 ? Math.min(2, remaining.length - 1) : 0;
    result.push(remaining.splice(index, 1)[0]);
  }
  return result;
}
export function randomChoice(recipes: Recipe[], random = Math.random) {
  return recipes.length
    ? recipes[
        Math.min(
          Math.min(5, recipes.length) - 1,
          Math.floor(Math.max(0, random()) * Math.min(5, recipes.length)),
        )
      ]
    : undefined;
}
