create or replace function public.is_game_token_available(p_qr_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.users as u
      where u.qr_token = p_qr_token
        and u.is_used = false
    )
    or exists (
      select 1
      from public."extra tokens" as et
      where et.qr_token = p_qr_token
        and et.is_used = false
        and et.is_occupied = false
    );
$$;

revoke all on function public.is_game_token_available(text) from public;
grant execute on function public.is_game_token_available(text) to anon, authenticated;

create or replace function public.claim_game_token(
  p_qr_token text,
  p_name text,
  p_phone_number text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session text := encode(extensions.gen_random_bytes(32), 'hex');
  v_session_hash text := encode(extensions.digest(v_session, 'sha256'), 'hex');
  v_claimed_id uuid;
begin
  if p_qr_token is null or trim(p_qr_token) = '' then
    return null;
  end if;

  if p_name is null or trim(p_name) = '' then
    return null;
  end if;

  if p_phone_number is null or trim(p_phone_number) = '' then
    return null;
  end if;

  update public.users
  set
    name = trim(p_name),
    phone_number = trim(p_phone_number),
    is_used = true,
    used_at = now(),
    play_session_hash = v_session_hash
  where qr_token = p_qr_token
    and is_used = false
  returning id into v_claimed_id;

  if v_claimed_id is not null then
    return v_session;
  end if;

  update public."extra tokens"
  set
    name = trim(p_name),
    phone_number = trim(p_phone_number),
    is_used = true,
    is_occupied = true,
    used_at = now(),
    play_session_hash = v_session_hash
  where qr_token = p_qr_token
    and is_used = false
    and is_occupied = false
  returning id into v_claimed_id;

  if v_claimed_id is null then
    return null;
  end if;

  return v_session;
end;
$$;

revoke all on function public.claim_game_token(text, text, text) from public;
grant execute on function public.claim_game_token(text, text, text) to anon, authenticated;

create or replace function public.save_game_score(
  p_qr_token text,
  p_play_session text,
  p_score integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saved_id uuid;
  v_session_hash text;
begin
  if p_qr_token is null or trim(p_qr_token) = '' then
    return false;
  end if;

  if p_play_session is null or trim(p_play_session) = '' then
    return false;
  end if;

  if p_score is null or p_score < 0 then
    return false;
  end if;

  v_session_hash := encode(extensions.digest(p_play_session, 'sha256'), 'hex');

  update public.users
  set score = p_score
  where qr_token = p_qr_token
    and is_used = true
    and score is null
    and play_session_hash = v_session_hash
  returning id into v_saved_id;

  if v_saved_id is not null then
    return true;
  end if;

  update public."extra tokens"
  set score = p_score
  where qr_token = p_qr_token
    and is_used = true
    and is_occupied = true
    and score is null
    and play_session_hash = v_session_hash
  returning id into v_saved_id;

  return v_saved_id is not null;
end;
$$;

revoke all on function public.save_game_score(text, text, integer) from public;
grant execute on function public.save_game_score(text, text, integer) to anon, authenticated;

create or replace function public.get_daily_leaderboard(
  p_play_session text default null,
  p_game_date date default ((now() at time zone 'Asia/Beirut')::date),
  p_limit integer default 7
)
returns table (
  rank integer,
  name text,
  points integer,
  is_current_user boolean
)
language sql
security definer
set search_path = ''
as $$
  with all_scores as (
    select
      0 as source_order,
      u.id,
      u.name,
      u.score,
      u.used_at,
      u.play_session_hash
    from public.users as u
    where
      u.score is not null
      and (u.used_at at time zone 'Asia/Beirut')::date = p_game_date

    union all

    select
      1 as source_order,
      et.id,
      et.name,
      et.score,
      et.used_at,
      et.play_session_hash
    from public."extra tokens" as et
    where
      et.score is not null
      and (et.used_at at time zone 'Asia/Beirut')::date = p_game_date
  ),
  ranked_scores as (
    select
      row_number() over (
        order by coalesce(all_scores.score, 0) desc,
                 all_scores.used_at asc,
                 all_scores.source_order asc,
                 all_scores.id asc
      )::integer as rank,
      coalesce(nullif(trim(all_scores.name), ''), 'Player') as name,
      coalesce(all_scores.score, 0)::integer as points,
      coalesce(
        all_scores.play_session_hash = encode(extensions.digest(p_play_session, 'sha256'), 'hex'),
        false
      ) as is_current_user
    from all_scores
  )
  select
    ranked_scores.rank,
    ranked_scores.name,
    ranked_scores.points,
    ranked_scores.is_current_user
  from ranked_scores
  where
    ranked_scores.rank <= greatest(1, least(p_limit, 50))
    or ranked_scores.is_current_user
  order by ranked_scores.rank;
$$;

revoke all on function public.get_daily_leaderboard(text, date, integer) from public;
grant execute on function public.get_daily_leaderboard(text, date, integer) to anon, authenticated;
