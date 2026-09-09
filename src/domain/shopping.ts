import { PlanItem, Recipe, ShoppingItem } from './model';
export function aggregate(
  plan: PlanItem[],
  recipes: Recipe[],
  pantry: string[],
  existing: ShoppingItem[] = [],
): ShoppingItem[] {
  const items = new Map<string, ShoppingItem>();
  for (const meal of plan) {
    const recipe = recipes.find((r) => r.id === meal.recipeId);
    if (!recipe || meal.servings <= 0) throw new Error('Repas ou portions invalides');
    for (const i of recipe.ingredients) {
      const unit = i.unit === 'kg' ? 'g' : i.unit === 'l' ? 'ml' : i.unit;
      const quantity =
        (i.quantity * (i.unit === 'kg' || i.unit === 'l' ? 1000 : 1) * meal.servings) /
        recipe.servings;
      const id = `${i.id}:${unit}`;
      const current = items.get(id);
      if (current) current.quantity += quantity;
      else
        items.set(id, {
          id,
          ingredientId: i.id,
          name: i.name,
          aisle: i.aisle,
          quantity,
          unit,
          checked: false,
          pantry: pantry.includes(i.id),
          manual: false,
        });
    }
  }
  return [...items.values()]
    .map((i) => ({
      ...i,
      quantity: Math.round(i.quantity * 100) / 100,
      checked: existing.some(
        (old) =>
          old.id === i.id && old.quantity === Math.round(i.quantity * 100) / 100 && old.checked,
      ),
    }))
    .concat(existing.filter((i) => i.manual))
    .sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
}
