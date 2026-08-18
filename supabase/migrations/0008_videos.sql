-- ---------------------------------------------------------------------
-- Board vidéo : chaque vidéo d'un projet devient une fiche individuelle
-- (statut, prestataire, dates) au lieu d'un simple compteur agrégé sur
-- le projet. Remplace nombre_prevu/booke/tourne/a_monter/termine.
-- ---------------------------------------------------------------------

-- Statuts vidéo par défaut, gérables ensuite depuis Gestion > Statuts
insert into statuts (type, label, couleur, categorie, ordre) values
  ('video', 'À tourner', '#98a7b8', 'orange', 0),
  ('video', 'Tourné', '#8cc5f4', 'orange', 1),
  ('video', 'En montage', '#56a5d1', 'orange', 2),
  ('video', 'À valider', '#f9c8a7', 'orange', 3),
  ('video', 'Livré', '#22c55e', 'vert', 4);

create table videos (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  titre text,
  statut_id uuid references statuts(id) on delete set null,
  prestataire_id uuid references prestataires(id) on delete set null,
  interviewe_id uuid references interviewes(id) on delete set null,
  date_tournage date,
  date_livraison date,
  notes text,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_videos_projet on videos(projet_id);
create index idx_videos_statut on videos(statut_id);
create index idx_videos_prestataire on videos(prestataire_id);

alter table videos enable row level security;

create policy videos_admin_all on videos for all using (is_admin()) with check (is_admin());

create policy videos_presta_select on videos for select
  using (is_prestataire_assigned(projet_id));
create policy videos_presta_update on videos for update
  using (prestataire_id = current_prestataire_id())
  with check (prestataire_id = current_prestataire_id());

create policy videos_client_select on videos for select
  using (projet_belongs_to_current_client(projet_id));

-- Reprise des compteurs existants : une fiche vidéo par unité comptée,
-- répartie sur le statut le plus proche (prévu et booké fusionnent en
-- "à tourner" car le board vidéo utilise la date de tournage pour
-- distinguer ce qui est planifié).
insert into videos (projet_id, statut_id)
select p.id, (select id from statuts where type = 'video' and label = 'À tourner')
from projets p, generate_series(1, p.nombre_prevu + p.nombre_booke) g
where p.nombre_prevu + p.nombre_booke > 0;

insert into videos (projet_id, statut_id)
select p.id, (select id from statuts where type = 'video' and label = 'Tourné')
from projets p, generate_series(1, p.nombre_tourne) g
where p.nombre_tourne > 0;

insert into videos (projet_id, statut_id)
select p.id, (select id from statuts where type = 'video' and label = 'En montage')
from projets p, generate_series(1, p.nombre_a_monter) g
where p.nombre_a_monter > 0;

insert into videos (projet_id, statut_id)
select p.id, (select id from statuts where type = 'video' and label = 'Livré')
from projets p, generate_series(1, p.nombre_termine) g
where p.nombre_termine > 0;

alter table projets
  drop column nombre_prevu,
  drop column nombre_booke,
  drop column nombre_tourne,
  drop column nombre_a_monter,
  drop column nombre_termine;
