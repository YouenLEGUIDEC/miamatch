export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'no-pork';
export type Preferences = {
  allergies: string[];
  excluded: string[];
  liked: string[];
  diet: Diet;
  maxMinutes: number;
  budget: number;
  skill: number;
  equipment: string[];
  proteinFocus: boolean;
};
export const defaultPreferences: Preferences = {
  allergies: [],
  excluded: [],
  liked: [],
  diet: 'omnivore',
  maxMinutes: 45,
  budget: 3,
  skill: 2,
  equipment: ['hob', 'oven'],
  proteinFocus: false,
};
export type Ingredient = {
  id: string;
  name: string;
  aisle: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'piece';
  allergens: string[];
};
export type NutritionValue = {
  value: number;
  unit: string;
  source: string;
  method: string;
  reference: string;
  confidence: 'low' | 'medium' | 'high';
};
export type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  image?: string;
  minutes: number;
  servings: number;
  mood: number;
  family: string;
  diets: Diet[];
  budget: number;
  skill: number;
  equipment: string[];
  allergensVerified: boolean;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: Record<string, NutritionValue>;
  source: {
    kind: 'fixture' | 'external' | 'editorial' | 'community';
    author: string;
    url: string | null;
    license: string;
    fetchedAt: string;
    canStore: boolean;
    canDisplayInstructions: boolean;
    canUseImage: boolean;
  };
  rating: number | null;
  ratingCount: number | null;
};
export type Vote = 'yes' | 'no' | 'love';
export type PlanItem = { id: string; recipeId: string; servings: number; day: string | null };
export type ShoppingItem = {
  id: string;
  ingredientId: string | null;
  name: string;
  aisle: string;
  quantity: number;
  unit: string;
  checked: boolean;
  pantry: boolean;
  manual: boolean;
};
export type Member = { id: string; name: string; preferences: Preferences };
export type Snapshot = {
  householdId: string;
  householdName: string;
  userId: string;
  members: Member[];
  preferences: Preferences;
  mood: number;
  votes: Record<string, Vote>;
  favorites: string[];
  matches: string[];
  plan: PlanItem[];
  target: number;
  servings: number;
  pantry: string[];
  shopping: ShoppingItem[];
  revision: number;
};
export type Action =
  | { type: 'preferences'; value: Preferences }
  | { type: 'mood'; value: number }
  | { type: 'vote'; recipeId: string; vote: Vote }
  | { type: 'favorite'; recipeId: string; value: boolean }
  | { type: 'week'; target: number; servings: number }
  | { type: 'plan-add'; recipeId: string; id: string }
  | { type: 'plan-remove'; id: string }
  | { type: 'plan-move'; id: string; direction: number }
  | { type: 'plan-day'; id: string; day: string | null }
  | { type: 'shopping-generate' }
  | { type: 'shopping-check'; id: string; checked: boolean }
  | { type: 'shopping-add'; id: string; name: string }
  | { type: 'pantry'; ingredientId: string; value: boolean };
