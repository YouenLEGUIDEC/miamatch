-- Hosted Supabase grants EXECUTE to anon directly by default.
revoke all on function public.is_member(uuid) from public, anon;
-- Invitations are accessible only through validated RPCs.
create policy invitations_no_direct_read on public.invitations for select to authenticated using (false);
