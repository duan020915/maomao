-- Only the circle creator may change its name; membership and invite code stay intact.
grant update(name) on public.mm_groups to authenticated;
create policy group_rename on public.mm_groups
  for update to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));
