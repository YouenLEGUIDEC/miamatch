-- Miamatch: private data is never exposed through a service key in the app.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, name text not null check(length(name) between 1 and 60), created_at timestamptz not null default now());
create table public.user_preferences (user_id uuid primary key references public.profiles(id) on delete cascade, value jsonb not null default '{"allergies":[],"excluded":[],"liked":[],"diet":"omnivore","maxMinutes":45,"budget":3,"skill":2,"equipment":["hob","oven"],"proteinFocus":false}', updated_at timestamptz not null default now());
create table public.households (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 60), owner_id uuid not null references public.profiles(id), mood numeric not null default .5 check(mood between 0 and 1), target int not null default 5 check(target between 1 and 14), servings int not null default 2 check(servings between 1 and 12), revision bigint not null default 0, created_at timestamptz not null default now());
create table public.household_members (household_id uuid not null references public.households(id) on delete cascade, user_id uuid not null unique references public.profiles(id) on delete cascade, joined_at timestamptz not null default now(), primary key(household_id,user_id));
create index members_user on public.household_members(user_id,household_id);
create table public.invitations (id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade, code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)), expires_at timestamptz not null default now()+interval '48 hours', used_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.recipe_sources (id text primary key, name text not null, original_url text, author text not null, license text not null, can_store boolean not null default false, can_display_instructions boolean not null default false, can_use_image boolean not null default false, fetched_at timestamptz not null default now());
create table public.recipes (id uuid primary key, source_id text not null references public.recipe_sources(id), origin text not null check(origin in ('fixture','external','editorial','community')), title text not null, minutes int not null check(minutes>0), servings int not null check(servings>0), mood numeric not null check(mood between 0 and 1), family text not null, diets text[] not null default '{}', budget int not null check(budget between 1 and 3), skill int not null check(skill between 1 and 3), equipment text[] not null default '{}', allergens_verified boolean not null default false, display_data jsonb not null, updated_at timestamptz not null default now());
create index recipe_ranking on public.recipes(minutes,budget,mood);
create index recipe_diets on public.recipes using gin(diets);
create table public.ingredients (id text primary key, name text not null, aisle text not null, allergens text[] not null default '{}');
create table public.recipe_ingredients (recipe_id uuid not null references public.recipes(id) on delete cascade, ingredient_id text not null references public.ingredients(id), quantity numeric not null check(quantity>0), unit text not null check(unit in ('g','kg','ml','l','piece')), primary key(recipe_id,ingredient_id,unit));
create index ingredient_exclusions on public.recipe_ingredients(ingredient_id,recipe_id);
create table public.recipe_nutrition (recipe_id uuid not null references public.recipes(id) on delete cascade, nutrient text not null, value numeric not null check(value>=0), unit text not null, source text not null, method text not null, reference_quantity text not null, confidence text not null check(confidence in ('low','medium','high')), primary key(recipe_id,nutrient));
create table public.swipes (household_id uuid not null references public.households(id) on delete cascade, user_id uuid not null references public.profiles(id), recipe_id uuid not null references public.recipes(id), vote text not null check(vote in ('yes','no','love')), updated_at timestamptz not null default now(), primary key(household_id,user_id,recipe_id));
create index swipe_matching on public.swipes(household_id,recipe_id,vote);
create table public.matches (household_id uuid not null references public.households(id) on delete cascade, recipe_id uuid not null references public.recipes(id), created_at timestamptz not null default now(), primary key(household_id,recipe_id));
create table public.favorites (user_id uuid not null references public.profiles(id) on delete cascade, recipe_id uuid not null references public.recipes(id), primary key(user_id,recipe_id));
create table public.meal_plan_items (id uuid primary key, household_id uuid not null references public.households(id) on delete cascade, recipe_id uuid not null references public.recipes(id), servings int not null check(servings between 1 and 12), position int not null, day text check(day in ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche')), created_at timestamptz not null default now(), unique(household_id,recipe_id));
create index plan_household on public.meal_plan_items(household_id,position);
create table public.pantry_items (household_id uuid not null references public.households(id) on delete cascade, ingredient_id text not null references public.ingredients(id), primary key(household_id,ingredient_id));
create table public.shopping_list_items (household_id uuid not null references public.households(id) on delete cascade, id text not null, ingredient_id text references public.ingredients(id), name text not null check(length(name) between 1 and 100), aisle text not null, quantity numeric not null check(quantity>0), unit text not null, checked boolean not null default false, pantry boolean not null default false, manual boolean not null default false, updated_at timestamptz not null default now(), primary key(household_id,id));
create table public.recipe_adaptations (id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade, recipe_id uuid not null references public.recipes(id), label text not null default 'Adaptation Miamatch ✨', constraints jsonb not null, content jsonb not null, model text not null, created_at timestamptz not null default now());
create table public.processed_operations (household_id uuid not null references public.households(id) on delete cascade, id uuid not null, user_id uuid not null references public.profiles(id), created_at timestamptz not null default now(), primary key(household_id,id));

create function public.is_member(h uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.household_members where household_id=h and user_id=auth.uid()); $$;
-- Restrict even definer entrypoints. All private writes go through validated RPCs below.
revoke all on function public.is_member(uuid) from public;
grant execute on function public.is_member(uuid) to authenticated;
do $$ declare t text; begin
 foreach t in array array['profiles','user_preferences','households','household_members','invitations','recipe_sources','recipes','ingredients','recipe_ingredients','recipe_nutrition','swipes','matches','favorites','meal_plan_items','pantry_items','shopping_list_items','recipe_adaptations','processed_operations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy own_profile on public.profiles for select to authenticated using (id=auth.uid());
create policy own_preferences on public.user_preferences for select to authenticated using(user_id=auth.uid());
create policy household_read on public.households for select to authenticated using(public.is_member(id));
create policy own_votes on public.swipes for select to authenticated using(user_id=auth.uid() and public.is_member(household_id));
create policy own_favorites on public.favorites for select to authenticated using(user_id=auth.uid());
create policy own_operations on public.processed_operations for select to authenticated using(user_id=auth.uid() and public.is_member(household_id));
do $$ declare t text; begin
 foreach t in array array['household_members','matches','meal_plan_items','pantry_items','shopping_list_items','recipe_adaptations'] loop
 execute format('create policy member_read on public.%I for select to authenticated using(public.is_member(household_id))',t);
 end loop;
 foreach t in array array['recipe_sources','recipes','ingredients','recipe_ingredients','recipe_nutrition'] loop
 execute format('create policy catalog_read on public.%I for select to authenticated using(true)',t);
 end loop;
end $$;

create function public.setup_profile(display_name text) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 insert into public.profiles(id,name) values(auth.uid(),trim(display_name)) on conflict(id) do update set name=excluded.name;
 insert into public.user_preferences(user_id) values(auth.uid()) on conflict do nothing;
end $$;
create function public.create_household(display_name text) returns uuid language plpgsql security definer set search_path='' as $$ declare h uuid; begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 insert into public.households(name,owner_id) values(trim(display_name),auth.uid()) returning id into h;
 insert into public.household_members values(h,auth.uid(),now()); return h;
end $$;
create function public.invite_member(h uuid) returns text language plpgsql security definer set search_path='' as $$ declare c text; begin
 if not public.is_member(h) then raise exception 'Accès refusé'; end if;
 if (select count(*) from public.invitations where household_id=h and created_at>now()-interval '1 hour')>=10 then raise exception 'Réessayez dans une heure'; end if;
 insert into public.invitations(household_id) values(h) returning code into c; return c;
end $$;
create function public.join_household(invite_code text) returns uuid language plpgsql security definer set search_path='' as $$ declare inv public.invitations; begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 select * into inv from public.invitations where code=upper(trim(invite_code)) and expires_at>now() and used_by is null for update;
 if inv.id is null then raise exception 'Code invalide ou expiré'; end if;
 perform 1 from public.households where id=inv.household_id for update;
 insert into public.household_members values(inv.household_id,auth.uid(),now());
 update public.invitations set used_by=auth.uid() where id=inv.id;
 -- Membership changes invalidate old all-member consensus.
 delete from public.matches where household_id=inv.household_id;
 update public.households set revision=revision+1 where id=inv.household_id;
 return inv.household_id;
end $$;

create function public.recipe_allowed(h uuid, r uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.recipes where id=r) and not exists (
 select 1 from public.household_members m join public.user_preferences p on p.user_id=m.user_id cross join public.recipes recipe
 where m.household_id=h and recipe.id=r and (
 recipe.minutes>(p.value->>'maxMinutes')::int or recipe.budget>(p.value->>'budget')::int or recipe.skill>(p.value->>'skill')::int
 or ((p.value->>'diet')<>'omnivore' and not recipe.diets @> array[p.value->>'diet'])
 or not recipe.equipment <@ array(select jsonb_array_elements_text(p.value->'equipment'))
 or (jsonb_array_length(p.value->'allergies')>0 and not recipe.allergens_verified)
 or exists(select 1 from public.recipe_ingredients ri join public.ingredients i on i.id=ri.ingredient_id where ri.recipe_id=r and ((p.value->'excluded') ? i.id or i.allergens && array(select jsonb_array_elements_text(p.value->'allergies'))))
 ));
$$;
-- Internal only: cannot be used to probe another household's restrictions.
revoke all on function public.recipe_allowed(uuid,uuid) from public,anon,authenticated;

create function public.household_snapshot(h uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb; begin
 if not public.is_member(h) then raise exception 'Accès refusé'; end if;
 select jsonb_build_object(
 'householdId',hh.id,'householdName',hh.name,'userId',auth.uid(),'mood',hh.mood,'target',hh.target,'servings',hh.servings,'revision',hh.revision,
 'preferences',(select value from public.user_preferences where user_id=auth.uid()),
 -- Share restrictive preferences explicitly within the crew; no private swipe exposure.
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'preferences',up.value) order by hm.joined_at) from public.household_members hm join public.profiles p on p.id=hm.user_id join public.user_preferences up on up.user_id=p.id where hm.household_id=h),'[]'),
 'votes',coalesce((select jsonb_object_agg(recipe_id,vote) from public.swipes where household_id=h and user_id=auth.uid()),'{}'),
 'favorites',coalesce((select jsonb_agg(recipe_id) from public.favorites where user_id=auth.uid()),'[]'),
 'matches',coalesce((select jsonb_agg(recipe_id) from public.matches where household_id=h),'[]'),
 'plan',coalesce((select jsonb_agg(jsonb_build_object('id',id,'recipeId',recipe_id,'servings',servings,'day',day) order by position,id) from public.meal_plan_items where household_id=h),'[]'),
 'pantry',coalesce((select jsonb_agg(ingredient_id) from public.pantry_items where household_id=h),'[]'),
 'shopping',coalesce((select jsonb_agg(jsonb_build_object('id',id,'ingredientId',ingredient_id,'name',name,'aisle',aisle,'quantity',quantity,'unit',unit,'checked',checked,'pantry',pantry,'manual',manual) order by aisle,name) from public.shopping_list_items where household_id=h),'[]')
 ) into result from public.households hh where hh.id=h;
 return result;
end $$;
create function public.validate_preferences(v jsonb) returns boolean language plpgsql immutable set search_path='' as $$ declare k text; begin
 if v is null or jsonb_typeof(v)<>'object' or not v ?& array['allergies','excluded','liked','diet','maxMinutes','budget','skill','equipment','proteinFocus'] then return false; end if;
 foreach k in array array['allergies','excluded','liked','equipment'] loop
 if jsonb_typeof(v->k)<>'array' or jsonb_array_length(v->k)>100 then return false; end if;
 if exists(select 1 from jsonb_array_elements(v->k) e where jsonb_typeof(e)<>'string' or length(e::text)>100) then return false; end if;
 end loop;
 return (v->>'diet') in ('omnivore','vegetarian','vegan','no-pork') and (v->>'maxMinutes')::int between 5 and 180 and (v->>'budget')::int between 1 and 3 and (v->>'skill')::int between 1 and 3 and jsonb_typeof(v->'proteinFocus')='boolean';
 exception when others then return false;
end $$;
create function public.apply_action(h uuid, operation_id uuid, action jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare t text:=action->>'type'; rid uuid; pos int; target_pos int; v jsonb; begin
 if not public.is_member(h) then raise exception 'Accès refusé'; end if;
 perform 1 from public.households where id=h for update;
 if exists(select 1 from public.processed_operations where household_id=h and id=operation_id) then return public.household_snapshot(h); end if;
 if t in ('vote','favorite','plan-add') then
 rid := (action->>'recipeId')::uuid;
 if not exists(select 1 from public.recipes where id=rid) then raise exception 'Recette introuvable'; end if;
 end if;
 case t
 when 'preferences' then
 v:=action->'value'; if not public.validate_preferences(v) then raise exception 'Préférences invalides'; end if;
 update public.user_preferences set value=v,updated_at=now() where user_id=auth.uid();
 delete from public.matches where household_id=h and not public.recipe_allowed(h,recipe_id);
 when 'mood' then update public.households set mood=(action->>'value')::numeric where id=h;
 when 'week' then update public.households set target=(action->>'target')::int,servings=(action->>'servings')::int where id=h;
 when 'favorite' then
 if (action->>'value')::boolean then insert into public.favorites values(auth.uid(),rid) on conflict do nothing;
 else delete from public.favorites where user_id=auth.uid() and recipe_id=rid; end if;
 when 'vote' then
 if not public.recipe_allowed(h,rid) then raise exception 'Recette exclue par les préférences du foyer'; end if;
 insert into public.swipes(household_id,user_id,recipe_id,vote) values(h,auth.uid(),rid,action->>'vote') on conflict(household_id,user_id,recipe_id) do update set vote=excluded.vote,updated_at=now();
 if action->>'vote'='love' then insert into public.favorites values(auth.uid(),rid) on conflict do nothing; end if;
 if (select count(*) from public.household_members where household_id=h)>=2 and not exists(select 1 from public.household_members m where m.household_id=h and not exists(select 1 from public.swipes s where s.household_id=h and s.recipe_id=rid and s.user_id=m.user_id and s.vote in ('yes','love'))) then
 insert into public.matches values(h,rid,now()) on conflict do nothing;
 else delete from public.matches where household_id=h and recipe_id=rid; end if;
 when 'plan-add' then
 if not public.recipe_allowed(h,rid) then raise exception 'Recette exclue par les préférences du foyer'; end if;
 if (select count(*) from public.meal_plan_items where household_id=h)<(select target from public.households where id=h) then
 insert into public.meal_plan_items(id,household_id,recipe_id,servings,position) select (action->>'id')::uuid,h,rid,servings,coalesce((select max(position)+1 from public.meal_plan_items where household_id=h),0) from public.households where id=h on conflict(household_id,recipe_id) do nothing; end if;
 when 'plan-remove' then delete from public.meal_plan_items where household_id=h and id=(action->>'id')::uuid;
 when 'plan-day' then update public.meal_plan_items set day=action->>'day' where household_id=h and id=(action->>'id')::uuid;
 when 'plan-move' then
 if (action->>'direction')::int not in (-1,1) then raise exception 'Direction invalide'; end if;
 select position into pos from public.meal_plan_items where household_id=h and id=(action->>'id')::uuid;
 if (action->>'direction')::int=1 then select min(position) into target_pos from public.meal_plan_items where household_id=h and position>pos;
 else select max(position) into target_pos from public.meal_plan_items where household_id=h and position<pos; end if;
 if target_pos is not null then update public.meal_plan_items set position=case when position=pos then target_pos else pos end where household_id=h and position in (pos,target_pos); end if;
 when 'pantry' then
 if (action->>'value')::boolean then insert into public.pantry_items values(h,action->>'ingredientId') on conflict do nothing;
 else delete from public.pantry_items where household_id=h and ingredient_id=action->>'ingredientId'; end if;
 update public.shopping_list_items set pantry=(action->>'value')::boolean,updated_at=now() where household_id=h and ingredient_id=action->>'ingredientId';
 when 'shopping-add' then
 insert into public.shopping_list_items(household_id,id,name,aisle,quantity,unit,manual) values(h,action->>'id',trim(action->>'name'),'Autres',1,'piece',true);
 when 'shopping-check' then
 update public.shopping_list_items set checked=(action->>'checked')::boolean,updated_at=now() where household_id=h and id=action->>'id';
 if not found then raise exception 'Article supprimé depuis votre dernière synchronisation'; end if;
 when 'shopping-generate' then
 if exists(select 1 from public.meal_plan_items where household_id=h and not public.recipe_allowed(h,recipe_id)) then raise exception 'Le planning contient un repas incompatible avec les préférences actuelles'; end if;
 insert into public.shopping_list_items(household_id,id,ingredient_id,name,aisle,quantity,unit,pantry)
 select h,i.id||':'||(case ri.unit when 'kg' then 'g' when 'l' then 'ml' else ri.unit end),i.id,i.name,i.aisle,round(sum(ri.quantity*(case when ri.unit in ('kg','l') then 1000 else 1 end)*p.servings/r.servings),2),(case ri.unit when 'kg' then 'g' when 'l' then 'ml' else ri.unit end),exists(select 1 from public.pantry_items where household_id=h and ingredient_id=i.id)
 from public.meal_plan_items p join public.recipes r on r.id=p.recipe_id join public.recipe_ingredients ri on ri.recipe_id=r.id join public.ingredients i on i.id=ri.ingredient_id
 where p.household_id=h group by i.id,i.name,i.aisle,(case ri.unit when 'kg' then 'g' when 'l' then 'ml' else ri.unit end)
 on conflict(household_id,id) do update set quantity=excluded.quantity,pantry=excluded.pantry,checked=case when shopping_list_items.quantity=excluded.quantity then shopping_list_items.checked else false end,updated_at=now();
 delete from public.shopping_list_items s where s.household_id=h and not s.manual and not exists(select 1 from public.meal_plan_items p join public.recipe_ingredients ri on ri.recipe_id=p.recipe_id where p.household_id=h and s.id=ri.ingredient_id||':'||(case ri.unit when 'kg' then 'g' when 'l' then 'ml' else ri.unit end));
 else raise exception 'Action inconnue'; end case;
 insert into public.processed_operations values(h,operation_id,auth.uid(),now());
 update public.households set revision=revision+1 where id=h;
 return public.household_snapshot(h);
end $$;
create function public.notify_household() returns trigger language plpgsql security definer set search_path='' as $$ begin
 perform realtime.send(jsonb_build_object('revision',new.revision),'changed','household:'||new.id::text,true);
 return new;
end $$;
create trigger household_changed after update on public.households for each row execute function public.notify_household();
create policy household_broadcast_read on realtime.messages for select to authenticated using(extension='broadcast' and exists(select 1 from public.household_members where user_id=auth.uid() and 'household:'||household_id::text = realtime.topic()));
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('setup_profile','create_household','invite_member','join_household','household_snapshot','apply_action') loop
 execute format('revoke all on function %s from public,anon',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
revoke all on function public.notify_household() from public,anon,authenticated;
revoke all on function public.validate_preferences(jsonb) from public,anon,authenticated;
