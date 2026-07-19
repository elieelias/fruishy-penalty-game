create or replace function public.get_daily_leaderboard(
  p_play_session text default null,
  p_game_date date default (((now() at time zone 'Asia/Beirut') - interval '2 hours')::date),
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
  with ranked_scores as (
    select
      row_number() over (
        order by coalesce(u.score, 0) desc, u.used_at asc, u.id asc
      )::integer as rank,
      coalesce(nullif(trim(u.name), ''), 'Player') as name,
      coalesce(u.score, 0)::integer as points,
      coalesce(
        u.play_session_hash = encode(extensions.digest(p_play_session, 'sha256'), 'hex'),
        false
      ) as is_current_user
    from public.users as u
    where
      u.score is not null
      and ((u.used_at at time zone 'Asia/Beirut') - interval '2 hours')::date = p_game_date
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
