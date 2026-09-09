import { Action, Snapshot, Vote, defaultPreferences } from '../domain/model';
import { recipes } from '../data/catalog';
import { eligible } from '../domain/recommend';
import { isMatch, reduce } from '../domain/reducer';
export type DemoData = {
  snapshot: Snapshot;
  votes: Record<string, Record<string, Vote>>;
  favorites: Record<string, string[]>;
};
export function initialDemo(name: string): DemoData {
  return {
    snapshot: {
      householdId: 'demo',
      householdName: 'La tablée',
      userId: 'demo-a',
      members: [{ id: 'demo-a', name, preferences: defaultPreferences }],
      preferences: defaultPreferences,
      mood: 0.5,
      votes: {},
      favorites: [],
      matches: [],
      plan: [],
      target: 5,
      servings: 2,
      pantry: [],
      shopping: [],
      revision: 0,
    },
    votes: {},
    favorites: {},
  };
}
export function demoAction(data: DemoData, action: Action): DemoData {
  const snapshot = reduce(data.snapshot, action, recipes);
  const votes = { ...data.votes, [snapshot.userId]: snapshot.votes };
  const favorites = { ...data.favorites, [snapshot.userId]: snapshot.favorites };
  const matches = recipes
    .filter(
      (r) =>
        eligible(
          r,
          snapshot.members.map((m) => m.preferences),
        ) &&
        isMatch(
          snapshot.members.map((m) => m.id),
          Object.fromEntries(snapshot.members.map((m) => [m.id, votes[m.id]?.[r.id]])),
        ),
    )
    .map((r) => r.id);
  return { snapshot: { ...snapshot, matches }, votes, favorites };
}
export function switchDemo(data: DemoData): DemoData {
  const current = data.snapshot;
  const members =
    current.members.length === 1
      ? [
          ...current.members,
          { id: 'demo-b', name: 'Convive 2', preferences: { ...defaultPreferences } },
        ]
      : current.members;
  const user = members.find((m) => m.id !== current.userId)!;
  return {
    ...data,
    snapshot: {
      ...current,
      members,
      userId: user.id,
      preferences: user.preferences,
      votes: data.votes[user.id] ?? {},
      favorites: data.favorites[user.id] ?? [],
    },
  };
}
