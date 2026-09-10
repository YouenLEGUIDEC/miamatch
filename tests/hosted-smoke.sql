-- Run through an authorized SQL connection. All test data is rolled back.
begin;
do $$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
 h uuid; code text; s jsonb; recipe uuid; op uuid := gen_random_uuid(); blocked boolean;
begin
 insert into auth.users(id) values(a),(b),(c);
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('role','authenticated',true);
 perform public.setup_profile('Test A');
 h := public.create_household('Validation temporaire');
 code := public.invite_member(h);
 select id into recipe from public.recipes order by id limit 1;
 perform public.apply_action(h,gen_random_uuid(),jsonb_build_object('type','vote','recipeId',recipe,'vote','yes'));
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.setup_profile('Test B');
 perform public.join_household(code);
 if exists(select 1 from public.swipes) then raise exception 'Private votes exposed'; end if;
 if exists(select 1 from public.invitations) then raise exception 'Invitation codes exposed'; end if;
 s := public.apply_action(h,gen_random_uuid(),jsonb_build_object('type','vote','recipeId',recipe,'vote','love'));
 if jsonb_array_length(s->'matches')<>1 then raise exception 'Match missing'; end if;
 perform public.apply_action(h,op,'{"type":"shopping-add","id":"smoke","name":"Éponge"}');
 s := public.apply_action(h,op,'{"type":"shopping-add","id":"smoke","name":"Éponge"}');
 if jsonb_array_length(s->'shopping')<>1 then raise exception 'Duplicate operation'; end if;
 perform public.apply_action(h,gen_random_uuid(),'{"type":"shopping-check","id":"smoke","checked":true}');
 perform set_config('request.jwt.claim.sub',a::text,true);
 s := public.household_snapshot(h);
 if (s->'shopping'->0->>'checked')::boolean is not true then raise exception 'Shared checkbox missing'; end if;
 perform public.apply_action(h,gen_random_uuid(),jsonb_build_object('type','plan-add','id',gen_random_uuid(),'recipeId',recipe));
 s := public.apply_action(h,gen_random_uuid(),'{"type":"shopping-generate"}');
 if jsonb_array_length(s->'shopping')<2 then raise exception 'Generated shopping missing'; end if;
 perform set_config('request.jwt.claim.sub',c::text,true);
 perform public.setup_profile('Test C');
 blocked := false;
 begin perform public.household_snapshot(h); exception when raise_exception then blocked := true; end;
 if not blocked then raise exception 'Foreign snapshot exposed'; end if;
 if exists(select 1 from public.shopping_list_items) then raise exception 'Foreign shopping exposed'; end if;
 blocked := false;
 begin perform public.apply_action(h,gen_random_uuid(),'{"type":"shopping-check","id":"smoke","checked":false}'); exception when raise_exception then blocked := true; end;
 if not blocked then raise exception 'Foreign write permitted'; end if;
 perform set_config('role','anon',true);
 if has_function_privilege('anon','public.is_member(uuid)','execute') then raise exception 'Anonymous helper access'; end if;
 if has_function_privilege('anon','public.apply_action(uuid,uuid,jsonb)','execute') then raise exception 'Anonymous write access'; end if;
 perform set_config('role','postgres',true);
end $$;
select 'PASS: hosted RPC, private votes, matching, shared shopping, idempotency, cross-household RLS, anonymous denial; test data rolled back' as result;
rollback;
