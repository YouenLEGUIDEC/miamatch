// Execute the real migration in WASM PostgreSQL. Auth and Realtime transport
// are shimmed only here; RLS, roles, SQL functions and constraints are real.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
alter default privileges grant execute on functions to anon, authenticated;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
create schema realtime; create table realtime.messages(extension text, topic text, payload jsonb); alter table realtime.messages enable row level security;
grant usage on schema realtime to authenticated; grant select on realtime.messages to authenticated;
create function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic',true) $$;
create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as $$ insert into realtime.messages values('broadcast',topic,payload) $$;`);
const migrations = new URL('../supabase/migrations/', import.meta.url);
for (const file of fs
  .readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  await db.exec(fs.readFileSync(new URL(file, migrations), 'utf8'));
}
await db.exec(fs.readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
const a = randomUUID(),
  b = randomUUID(),
  c = randomUUID();
await db.query('insert into auth.users values ($1),($2),($3)', [a, b, c]);
async function as(id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
}
async function call(name, args = []) {
  return (
    await db.query(
      `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as result`,
      args,
    )
  ).rows[0].result;
}
async function action(h, value, id = randomUUID()) {
  return call('apply_action', [h, id, JSON.stringify(value)]);
}
await as(a);
await call('setup_profile', ['Alice']);
const h = await call('create_household', ['Notre tablée']);
const invite = await call('invite_member', [h]);
const recipes = JSON.parse(fs.readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
await action(h, { type: 'vote', recipeId: recipes[0].id, vote: 'yes' });
assert.equal((await call('household_snapshot', [h])).matches.length, 0);
await as(b);
await call('setup_profile', ['Bob']);
await call('join_household', [invite]);
assert.equal(
  (await db.query('select * from public.swipes')).rows.length,
  0,
  'other users cannot see Alice’s votes',
);
assert.equal(
  (await db.query('select * from public.invitations')).rows.length,
  0,
  'invitation codes are never enumerable',
);
await assert.rejects(() => call('join_household', [invite]), /Code invalide/);
let s = await action(h, { type: 'vote', recipeId: recipes[0].id, vote: 'love' });
assert.deepEqual(s.matches, [recipes[0].id]);
const op = randomUUID();
await action(h, { type: 'shopping-add', id: 'manual-test', name: 'Éponge' }, op);
s = await action(h, { type: 'shopping-add', id: 'manual-test', name: 'Éponge' }, op);
assert.equal(s.shopping.length, 1, 'idempotency prevents duplicate inserts');
for (const r of recipes.slice(0, 5))
  s = await action(h, { type: 'plan-add', id: randomUUID(), recipeId: r.id });
assert.equal(s.plan.length, 5);
s = await action(h, { type: 'shopping-generate' });
assert.ok(s.shopping.length > 5);
assert.ok(s.shopping.find((i) => i.id === 'manual-test'));
const chicken = s.shopping.find((i) => i.ingredientId === 'chicken');
assert.equal(chicken.quantity, 300);
s = await action(h, { type: 'shopping-check', id: chicken.id, checked: true });
await as(a);
assert.equal(
  (await call('household_snapshot', [h])).shopping.find((i) => i.id === chicken.id).checked,
  true,
  'second user sees committed checkbox',
);
s = await action(h, { type: 'shopping-generate' });
assert.equal(s.shopping.find((i) => i.id === chicken.id).checked, true);
const first = s.plan[0];
await action(h, { type: 'plan-move', id: first.id, direction: 1 });
assert.equal((await call('household_snapshot', [h])).plan[1].id, first.id);
await action(h, { type: 'plan-day', id: first.id, day: 'Lundi' });
await action(h, { type: 'pantry', ingredientId: 'rice', value: true });
assert.equal(
  (await call('household_snapshot', [h])).shopping.find((i) => i.ingredientId === 'rice').pantry,
  true,
);
await assert.rejects(() => action(h, { type: 'preferences', value: {} }), /Préférences invalides/);
await assert.rejects(() => action(h, { type: 'week', target: 100, servings: 2 }));
const prefs = (await call('household_snapshot', [h])).preferences;
await action(h, { type: 'preferences', value: { ...prefs, diet: 'vegan' } });
await assert.rejects(
  () => action(h, { type: 'vote', recipeId: recipes[0].id, vote: 'yes' }),
  /exclue/,
);
await assert.rejects(() => action(h, { type: 'shopping-generate' }), /incompatible/);
assert.equal(
  (await call('household_snapshot', [h])).matches.length,
  0,
  'preferences invalidate incompatible matches',
);
await as(c);
await call('setup_profile', ['Stranger']);
await call('create_household', ['Other']);
await assert.rejects(() => call('household_snapshot', [h]), /Accès refusé/);
await assert.rejects(
  () => action(h, { type: 'shopping-check', id: chicken.id, checked: false }),
  /Accès refusé/,
);
await assert.rejects(() => call('invite_member', [h]), /Accès refusé/);
assert.equal((await db.query('select * from public.shopping_list_items')).rows.length, 0);
assert.equal((await db.query('select * from public.households')).rows.length, 1);
await assert.rejects(
  () =>
    db.query('insert into public.household_members(household_id,user_id) values($1,$2)', [h, c]),
  /permission denied/,
);
await assert.rejects(
  () => db.query('update public.shopping_list_items set checked=false'),
  /permission denied/,
);
await db.query("select set_config('realtime.topic',$1,false)", ['household:' + h]);
assert.equal(
  (await db.query('select * from realtime.messages')).rows.length,
  0,
  'foreign realtime topic denied',
);
await as(a);
await db.query("select set_config('realtime.topic',$1,false)", ['household:' + h]);
const messages = (await db.query('select * from realtime.messages')).rows;
assert.ok(messages.length > 0);
assert.deepEqual(Object.keys(messages[0].payload), ['revision'], 'no private votes in broadcasts');
await db.exec('reset role; set role anon');
await assert.rejects(() => call('household_snapshot', [h]), /permission denied/);
await assert.rejects(() => call('is_member', [h]), /permission denied/);
await db.close();
console.log(
  'PASS: migration, seed, auth roles, cross-household RLS, private swipes, one-use invite, matching, preferences, plan, shopping, pantry, idempotency, broadcast authorization.',
);
