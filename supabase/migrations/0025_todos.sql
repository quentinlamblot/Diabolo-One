-- Tâches ad hoc assignées à un prestataire (indépendantes des projets/vidéos),
-- avec une date et une case à cocher quand c'est fait.
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  date date,
  prestataire_id uuid not null references prestataires(id) on delete cascade,
  fait boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_todos_prestataire on todos(prestataire_id);

alter table todos enable row level security;

create policy todos_admin_all on todos for all using (is_admin()) with check (is_admin());
-- Le prestataire assigné voit ses propres tâches et peut cocher/décocher
-- "fait", mais ne peut ni les créer ni changer qui est assigné.
create policy todos_presta_select on todos for select using (prestataire_id = current_prestataire_id());
create policy todos_presta_update on todos for update
  using (prestataire_id = current_prestataire_id())
  with check (prestataire_id = current_prestataire_id());

notify pgrst, 'reload schema';
