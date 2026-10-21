-- Apply only to a NEW, independent Supabase project, after supabase/schema.sql.
-- Do NOT run against your friend's live database without their permission.
alter table public.mm_entries
  add column if not exists start_time time,
  add column if not exists end_time time;
alter table public.mm_entries drop constraint if exists mm_entries_time_order;
alter table public.mm_entries add constraint mm_entries_time_order
  check (start_time is null or end_time is null or end_time > start_time);
alter table public.mm_responses drop constraint if exists mm_responses_kind_check;
alter table public.mm_responses add constraint mm_responses_kind_check
  check (kind in ('comment','like','join','accept','decline','maybe'));

-- Atomic, authenticated RSVP change. The caller may only vote for an
-- invitation in a group they belong to. Row changes use the caller's identity.
create or replace function public.mm_set_rsvp(p_entry uuid, p_vote text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_group uuid; v_kind text;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_vote not in ('accept','decline','maybe') then raise exception '回复无效'; end if;
  select group_id,kind into v_group,v_kind from public.mm_entries where id=p_entry;
  if v_group is null or v_kind <> 'event' or not public.mm_is_member(v_group) then
    raise exception '没有权限回复这条邀约';
  end if;
  delete from public.mm_responses
   where entry_id=p_entry and user_id=auth.uid() and kind in ('join','accept','decline','maybe');
  insert into public.mm_responses(entry_id,user_id,body,kind)
    values(p_entry,auth.uid(),case p_vote when 'accept' then '可以参加' when 'decline' then '不能参加' else '待定' end,p_vote);
end;
$$;
revoke all on function public.mm_set_rsvp(uuid,text) from public,anon;
grant execute on function public.mm_set_rsvp(uuid,text) to authenticated;
create index if not exists mm_entries_group_day_time on public.mm_entries(group_id,day,start_time);
