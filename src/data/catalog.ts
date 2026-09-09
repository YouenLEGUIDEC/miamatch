import data from './recipes.json';
import { Recipe } from '../domain/model';
export const recipes = data as Recipe[];
export const ingredients = [
  ...new Map(recipes.flatMap((r) => r.ingredients).map((i) => [i.id, i])).values(),
];
