import fs from 'node:fs';
const recipes = JSON.parse(fs.readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";
const array = (xs) => 'ARRAY[' + xs.map(q).join(',') + ']::text[]';
let sql = '-- SYNTHETIC DEVELOPMENT FIXTURES. Not validated cooking content.\n';
sql +=
  "insert into public.recipe_sources(id,name,author,license,can_store,can_display_instructions,can_use_image) values('fixtures','Démonstration','Miamatch — jeu de test synthétique','Fixtures internes non validées',true,false,false) on conflict do nothing;\n";
for (const i of new Map(recipes.flatMap((r) => r.ingredients).map((i) => [i.id, i])).values())
  sql += `insert into public.ingredients values(${q(i.id)},${q(i.name)},${q(i.aisle)},${array(i.allergens)}) on conflict do nothing;\n`;
for (const r of recipes) {
  sql += `insert into public.recipes(id,source_id,origin,title,minutes,servings,mood,family,diets,budget,skill,equipment,allergens_verified,display_data) values(${q(r.id)},'fixtures','fixture',${q(r.title)},${r.minutes},${r.servings},${r.mood},${q(r.family)},${array(r.diets)},${r.budget},${r.skill},${array(r.equipment)},true,${q(JSON.stringify(r))}::jsonb) on conflict do nothing;\n`;
  for (const i of r.ingredients)
    sql += `insert into public.recipe_ingredients values(${q(r.id)},${q(i.id)},${i.quantity},${q(i.unit)}) on conflict do nothing;\n`;
}
fs.writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
