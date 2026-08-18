-- Import flexible : le nom n'est plus obligatoire, on peut importer n'importe
-- quelle colonne (l'utilisateur choisit la correspondance à l'import).
alter table interviewes alter column nom drop not null;

-- Commentaires liés à un projet et/ou à l'affectation d'un prestataire
create table commentaires (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  prestataire_id uuid references prestataires(id) on delete cascade,
  auteur_id uuid not null references profiles(id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now()
);

create index idx_commentaires_projet on commentaires(projet_id);
create index idx_commentaires_prestataire on commentaires(prestataire_id);

alter table commentaires enable row level security;

-- admin : accès complet
create policy commentaires_admin_all on commentaires for all using (is_admin()) with check (is_admin());

-- prestataire : voit/écrit les commentaires des projets où il est affecté
create policy commentaires_presta_select on commentaires for select
  using (is_prestataire_assigned(projet_id));
create policy commentaires_presta_insert on commentaires for insert
  with check (is_prestataire_assigned(projet_id) and auteur_id = auth.uid());

-- client : voit/écrit les commentaires de ses propres projets (hors commentaires liés à un prestataire précis)
create policy commentaires_client_select on commentaires for select
  using (projet_belongs_to_current_client(projet_id));
create policy commentaires_client_insert on commentaires for insert
  with check (projet_belongs_to_current_client(projet_id) and auteur_id = auth.uid() and prestataire_id is null);
