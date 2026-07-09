create table if not exists public."extra tokens" (
  like public.users including defaults including constraints including indexes
);

alter table public."extra tokens"
  add column if not exists is_occupied boolean not null default false;

alter table public."extra tokens" enable row level security;

create unique index if not exists extra_tokens_qr_token_key
  on public."extra tokens" (qr_token)
  where qr_token is not null;

with needed as (
  select greatest(0, 5000 - count(*)::integer) as amount
  from public."extra tokens"
), candidates as (
  select
    gen_random_uuid() as id,
    gen_random_uuid()::varchar as qr_token
  from needed, generate_series(1, greatest(needed.amount * 3, needed.amount + 100))
), filtered as (
  select distinct on (c.qr_token)
    c.id,
    c.qr_token
  from candidates c
  where not exists (
    select 1 from public.users u where u.qr_token = c.qr_token
  )
  and not exists (
    select 1 from public."extra tokens" et where et.qr_token = c.qr_token
  )
), limited as (
  select filtered.id, filtered.qr_token
  from filtered, needed
  limit (select amount from needed)
)
insert into public."extra tokens" (id, qr_token, is_occupied)
select limited.id, limited.qr_token, false
from limited;
