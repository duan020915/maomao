-- Native iOS device registration. A user can manage only their own device tokens.
create table public.mm_device_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null check (token ~ '^[0-9a-f]{64,200}$'),
  platform text not null check (platform = 'ios'),
  environment text not null check (environment in ('production', 'sandbox')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.mm_device_tokens enable row level security;
create policy device_tokens_own on public.mm_device_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.mm_device_tokens to authenticated;

-- This queue is only read by the push delivery function with the service role.
create table public.mm_push_events (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.mm_groups(id) on delete cascade,
  entry_id uuid references public.mm_entries(id) on delete cascade,
  kind text not null check (kind in ('entry', 'comment', 'rsvp')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.mm_push_events enable row level security;
revoke all on public.mm_push_events from anon, authenticated;
create index mm_push_events_pending on public.mm_push_events(id) where sent_at is null;

create function public.mm_queue_entry_push() returns trigger language plpgsql security definer
set search_path = public as $$
declare actor_name text;
begin
  select coalesce(nullif(name, ''), '朋友') into actor_name from public.mm_profiles where id = new.user_id;
  insert into public.mm_push_events (recipient_id, group_id, entry_id, kind, title, body)
  select m.user_id, new.group_id, new.id, 'entry',
    coalesce(actor_name, '朋友') || case new.kind when 'event' then '发起了邀约' when 'post' then '冒了个泡' else '更新了日程' end,
    left(split_part(new.body, E'\n', 1), 100)
  from public.mm_members m where m.group_id = new.group_id and m.user_id <> new.user_id;
  return new;
end $$;
create trigger mm_entry_push after insert on public.mm_entries
for each row execute function public.mm_queue_entry_push();

create function public.mm_queue_response_push() returns trigger language plpgsql security definer
set search_path = public as $$
declare parent public.mm_entries%rowtype;
declare actor_name text;
begin
  if new.kind not in ('comment', 'accept', 'decline', 'join', 'maybe') then return new; end if;
  select * into parent from public.mm_entries where id = new.entry_id;
  if not found or parent.user_id = new.user_id then return new; end if;
  select coalesce(nullif(name, ''), '朋友') into actor_name from public.mm_profiles where id = new.user_id;
  insert into public.mm_push_events (recipient_id, group_id, entry_id, kind, title, body)
  values (parent.user_id, parent.group_id, parent.id,
    case when new.kind = 'comment' then 'comment' else 'rsvp' end,
    coalesce(actor_name, '朋友') || case when new.kind = 'comment' then '评论了你的分享' else '回复了你的邀约' end,
    left(coalesce(nullif(new.body, ''), case when new.kind in ('accept', 'join') then '可以参加' else '暂时不能参加' end), 100));
  return new;
end $$;
create trigger mm_response_push after insert on public.mm_responses
for each row execute function public.mm_queue_response_push();
