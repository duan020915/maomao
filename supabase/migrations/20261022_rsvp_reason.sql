-- Apply to an independent Supabase project after 20261021_timeline_rsvp.sql.
-- This adds an optional reason while preserving the atomic RSVP update.
create or replace function public.mm_set_rsvp(p_entry uuid, p_vote text, p_reason text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_group uuid; v_kind text; v_reason text;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_vote not in ('accept','decline','maybe') then raise exception '回复无效'; end if;
  v_reason := trim(coalesce(p_reason, ''));
  if length(v_reason) > 500 then raise exception '理由请控制在 500 字以内'; end if;
  select group_id, kind into v_group, v_kind from public.mm_entries where id = p_entry;
  if v_group is null or v_kind <> 'event' or not public.mm_is_member(v_group) then
    raise exception '没有权限回复这条邀约';
  end if;
  delete from public.mm_responses
    where entry_id = p_entry and user_id = auth.uid() and kind in ('join','accept','decline','maybe');
  insert into public.mm_responses(entry_id, user_id, body, kind)
    values (p_entry, auth.uid(), coalesce(nullif(v_reason, ''),
      case p_vote when 'accept' then '可以参加' when 'decline' then '不能参加' else '待定' end), p_vote);
end;
$$;
revoke all on function public.mm_set_rsvp(uuid,text,text) from public, anon;
grant execute on function public.mm_set_rsvp(uuid,text,text) to authenticated;
