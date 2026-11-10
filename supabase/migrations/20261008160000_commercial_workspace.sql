-- Private commercial workspace. Optimistic revision check atomically saves the
-- campaigns, daily results, closes, configuration and audit trail together.
create table if not exists public.commercial_workspace (
  id text primary key check (id = 'main'),
  state jsonb not null,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(state) = 'object')
);
alter table public.commercial_workspace enable row level security;
revoke all on public.commercial_workspace from anon, authenticated;
grant all on public.commercial_workspace to service_role;
insert into public.commercial_workspace(id,state) values ('main', jsonb_build_object(
  'revision',0,'campaigns','[]'::jsonb,'days','[]'::jsonb,'closes','[]'::jsonb,'events','[]'::jsonb,
  'config',jsonb_build_object('deadline','20:00','trackingStart',(now() at time zone 'America/Bogota')::date::text,'workDays','[1,2,3,4,5,6]'::jsonb,'holidays','[]'::jsonb)
)) on conflict do nothing;
create or replace function public.save_commercial_workspace(expected_revision integer, next_state jsonb)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  if (next_state->>'revision')::integer <> expected_revision + 1 then
    raise exception 'Invalid revision';
  end if;
  update public.commercial_workspace set state = next_state, updated_at = now()
  where id = 'main' and (state->>'revision')::integer = expected_revision;
  return found;
end;
$$;
revoke all on function public.save_commercial_workspace(integer,jsonb) from public, anon, authenticated;
grant execute on function public.save_commercial_workspace(integer,jsonb) to service_role;
