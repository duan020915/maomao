-- Apply to the NEW Maomao Supabase project after schema.sql and the RSVP migrations.
create table public.mm_approval_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mm_groups on delete cascade,
  user_id uuid not null references public.mm_profiles,
  item text not null check (length(item) between 1 and 80),
  currency text not null check (currency in ('CNY','USD','EUR')),
  price numeric(12,2) not null check (price between 0.01 and 9999999),
  reason text not null check (length(reason) between 1 and 300),
  alternative text not null default '' check (length(alternative) <= 300),
  images text[] not null default '{}'::text[]
    check (cardinality(images) <= 3 and octet_length(array_to_string(images,'')) < 4500000),
  mode text not null check (mode in ('single','multi')),
  created_at timestamptz not null default now()
);

create table public.mm_approval_votes (
  request_id uuid not null references public.mm_approval_requests on delete cascade,
  user_id uuid not null references public.mm_profiles,
  choice text not null check (choice in ('approve','reject')),
  reason text not null check (length(reason) between 1 and 300),
  created_at timestamptz not null default now(),
  primary key (request_id,user_id)
);

alter table public.mm_approval_requests enable row level security;
alter table public.mm_approval_votes enable row level security;

create policy approval_request_read on public.mm_approval_requests
  for select to authenticated using (public.mm_is_member(group_id));
create policy approval_request_insert on public.mm_approval_requests
  for insert to authenticated
  with check (user_id=auth.uid() and public.mm_is_member(group_id));
create policy approval_vote_read on public.mm_approval_votes
  for select to authenticated using (
    exists (select 1 from public.mm_approval_requests r
      where r.id=request_id and public.mm_is_member(r.group_id))
  );
create policy approval_vote_insert on public.mm_approval_votes
  for insert to authenticated with check (
    user_id=auth.uid() and exists (
      select 1 from public.mm_approval_requests r
      where r.id=request_id and r.user_id<>auth.uid() and public.mm_is_member(r.group_id)
    )
  );
create policy approval_vote_update on public.mm_approval_votes
  for update to authenticated using (
    user_id=auth.uid() and exists (
      select 1 from public.mm_approval_requests r
      where r.id=request_id and r.user_id<>auth.uid() and public.mm_is_member(r.group_id)
    )
  ) with check (
    user_id=auth.uid() and exists (
      select 1 from public.mm_approval_requests r
      where r.id=request_id and r.user_id<>auth.uid() and public.mm_is_member(r.group_id)
    )
  );

grant select,insert on public.mm_approval_requests to authenticated;
grant select,insert,update on public.mm_approval_votes to authenticated;
create index mm_approval_requests_group_created on public.mm_approval_requests(group_id,created_at desc);
create index mm_approval_votes_request_created on public.mm_approval_votes(request_id,created_at);
