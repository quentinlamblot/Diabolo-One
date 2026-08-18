-- Trame d'interview générée par l'IA à partir du brief d'onboarding, pour
-- guider l'équipe pendant le tournage du témoignage client.
create table trames_interview (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null unique references projets(id) on delete cascade,
  type_interview text not null check (type_interview in ('longue', 'courte')),
  questions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table trames_interview enable row level security;

create policy trames_interview_admin_all on trames_interview for all using (is_admin()) with check (is_admin());
