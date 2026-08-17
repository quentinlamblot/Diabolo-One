-- Retrait du taux horaire (remplacé par le nouveau système de rémunération par tâche)
alter table prestataires drop column if exists taux_horaire;

-- Types de rémunération
create type type_remuneration as enum ('monteur', 'graphiste', 'chef_de_projet');

-- Tarifs configurables par l'admin pour les vidéos montées (monteur)
create table tarifs_monteur (
  id uuid primary key default gen_random_uuid(),
  cle text unique not null,
  libelle text not null,
  prix numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into tarifs_monteur (cle, libelle, prix) values
  ('video_premium', 'Vidéo montée premium', 0),
  ('video_classique', 'Vidéo montée classique', 0);

alter table tarifs_monteur enable row level security;
create policy tarifs_monteur_select on tarifs_monteur for select using (auth.uid() is not null);
create policy tarifs_monteur_write on tarifs_monteur for all using (is_admin()) with check (is_admin());

-- Nouvelles colonnes sur taches_prestataires pour le détail du calcul
alter table taches_prestataires
  add column type_remuneration type_remuneration,
  add column sous_type text,
  add column quantite integer,
  add column pourcentage_remuneration numeric(5,2),
  add column pourcentage_effectue numeric(5,2);
