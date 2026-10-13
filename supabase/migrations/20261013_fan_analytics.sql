create table if not exists public.fan_viewers (
  team_id uuid not null references public.teams(id) on delete cascade,
  season_year integer not null,
  visitor_id uuid not null,
  first_seen_at timestamptz not null default now(),
  primary key (team_id, season_year, visitor_id)
);

alter table public.fan_viewers enable row level security;
revoke all on public.fan_viewers from anon, authenticated;

create or replace function public.record_fan_view(p_team_slug text, p_visitor_id uuid)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_team_id uuid;
  v_season_year integer;
  v_total bigint;
begin
  select id, season_year
    into v_team_id, v_season_year
    from public.teams
    where slug = p_team_slug;

  if v_team_id is null then
    raise exception 'Fan link team not found';
  end if;

  v_season_year := coalesce(v_season_year, extract(year from current_date)::integer);

  insert into public.fan_viewers (team_id, season_year, visitor_id)
  values (v_team_id, v_season_year, p_visitor_id)
  on conflict (team_id, season_year, visitor_id) do nothing;

  select count(*)
    into v_total
    from public.fan_viewers
    where team_id = v_team_id
      and season_year = v_season_year;

  return v_total;
end;
$$;

create or replace function public.get_fan_view_count(p_team_id uuid, p_season_year integer)
returns bigint
language sql
security definer
set search_path = pg_catalog, public
as $$
  select count(*)
  from public.fan_viewers
  where team_id = p_team_id
    and season_year = p_season_year;
$$;

revoke all on function public.record_fan_view(text, uuid) from public;
revoke all on function public.get_fan_view_count(uuid, integer) from public;
grant execute on function public.record_fan_view(text, uuid) to anon, authenticated;
grant execute on function public.get_fan_view_count(uuid, integer) to anon, authenticated;
