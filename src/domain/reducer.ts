import { Action, Recipe, Snapshot, Vote } from './model';
import { eligible } from './recommend';
import { aggregate } from './shopping';
const toggle = (list: string[], id: string, value: boolean) =>
  value ? [...new Set([...list, id])] : list.filter((x) => x !== id);
export function isMatch(members: string[], votes: Record<string, Vote>) {
  return members.length >= 2 && members.every((id) => votes[id] === 'yes' || votes[id] === 'love');
}
export function reduce(s: Snapshot, action: Action, recipes: Recipe[]): Snapshot {
  const next = { ...s, revision: s.revision + 1 };
  switch (action.type) {
    case 'preferences':
      return {
        ...next,
        preferences: action.value,
        members: s.members.map((m) =>
          m.id === s.userId ? { ...m, preferences: action.value } : m,
        ),
      };
    case 'mood':
      return { ...next, mood: Math.max(0, Math.min(1, action.value)) };
    case 'vote':
      return {
        ...next,
        votes: { ...s.votes, [action.recipeId]: action.vote },
        favorites:
          action.vote === 'love' ? toggle(s.favorites, action.recipeId, true) : s.favorites,
      };
    case 'favorite':
      return { ...next, favorites: toggle(s.favorites, action.recipeId, action.value) };
    case 'week':
      if (action.target < 1 || action.target > 14 || action.servings < 1 || action.servings > 12)
        throw new Error('Choisissez 1 à 14 repas et 1 à 12 personnes.');
      return { ...next, target: action.target, servings: action.servings };
    case 'plan-add': {
      const r = recipes.find((r) => r.id === action.recipeId);
      if (
        !r ||
        !eligible(
          r,
          s.members.map((m) => m.preferences),
        )
      )
        throw new Error('Ce repas ne respecte plus les préférences du foyer.');
      if (s.plan.some((p) => p.recipeId === r.id) || s.plan.length >= s.target) return s;
      return {
        ...next,
        plan: [...s.plan, { id: action.id, recipeId: r.id, servings: s.servings, day: null }],
      };
    }
    case 'plan-remove':
      return { ...next, plan: s.plan.filter((p) => p.id !== action.id) };
    case 'plan-day':
      return {
        ...next,
        plan: s.plan.map((p) => (p.id === action.id ? { ...p, day: action.day } : p)),
      };
    case 'plan-move': {
      const plan = [...s.plan];
      const index = plan.findIndex((p) => p.id === action.id);
      const to = index + action.direction;
      if (index >= 0 && to >= 0 && to < plan.length)
        [plan[index], plan[to]] = [plan[to], plan[index]];
      return { ...next, plan };
    }
    case 'shopping-generate':
      if (
        s.plan.some((p) => {
          const r = recipes.find((r) => r.id === p.recipeId);
          return (
            !r ||
            !eligible(
              r,
              s.members.map((m) => m.preferences),
            )
          );
        })
      )
        throw new Error(
          'Le planning contient un repas incompatible avec les préférences actuelles.',
        );
      return { ...next, shopping: aggregate(s.plan, recipes, s.pantry, s.shopping) };
    case 'shopping-check':
      return {
        ...next,
        shopping: s.shopping.map((i) =>
          i.id === action.id ? { ...i, checked: action.checked } : i,
        ),
      };
    case 'shopping-add':
      if (!action.name.trim() || action.name.length > 100)
        throw new Error('Article invalide (1 à 100 caractères).');
      return {
        ...next,
        shopping: [
          ...s.shopping,
          {
            id: action.id,
            ingredientId: null,
            name: action.name.trim(),
            quantity: 1,
            unit: 'piece',
            aisle: 'Autres',
            checked: false,
            pantry: false,
            manual: true,
          },
        ],
      };
    case 'pantry':
      return {
        ...next,
        pantry: toggle(s.pantry, action.ingredientId, action.value),
        shopping: s.shopping.map((i) =>
          i.ingredientId === action.ingredientId ? { ...i, pantry: action.value } : i,
        ),
      };
  }
}
