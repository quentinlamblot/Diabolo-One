-- Le statut d'un contact peut être piloté par l'étape du pipeline vidéo,
-- configurable par statut vidéo plutôt que codé en dur ("Tourné" en dur) :
-- la colonne "Booké" peut vouloir dire "RDV pris" ou "déjà filmé" selon
-- l'équipe, donc c'est à l'admin de choisir la correspondance.
alter table statuts add column if not exists statut_interviewe_lie_id uuid references statuts(id) on delete set null;

-- Reprend le comportement précédent par défaut (toute étape après la 1ère
-- déclenchait "Tourné" côté contact), ajustable ensuite depuis Gestion >
-- Statuts. Ne touche que les statuts encore non mappés, donc sans risque à
-- relancer.
update statuts s
set statut_interviewe_lie_id = (
  select id from statuts where type = 'interviewe' and label = 'Tourné' limit 1
)
where s.type = 'video'
  and s.statut_interviewe_lie_id is null
  and s.ordre > (select min(ordre) from statuts where type = 'video');

-- Responsable par colonne du pipeline vidéo, défini par projet : le
-- responsable d'une vidéo se déduit automatiquement de la colonne où elle
-- se trouve (ex. Bruno sur "À tourner"/"Booké"/"À valider", Hippolyte sur
-- "En montage"), au lieu d'être choisi vidéo par vidéo.
create table if not exists projet_video_responsables (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  statut_id uuid not null references statuts(id) on delete cascade,
  prestataire_id uuid not null references prestataires(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (projet_id, statut_id)
);

create index if not exists idx_pvr_projet on projet_video_responsables(projet_id);

alter table projet_video_responsables enable row level security;

drop policy if exists pvr_admin_all on projet_video_responsables;
create policy pvr_admin_all on projet_video_responsables for all
  using (is_admin()) with check (is_admin());
drop policy if exists pvr_presta_select on projet_video_responsables;
create policy pvr_presta_select on projet_video_responsables for select
  using (is_prestataire_assigned(projet_id));
drop policy if exists pvr_client_select on projet_video_responsables;
create policy pvr_client_select on projet_video_responsables for select
  using (projet_belongs_to_current_client(projet_id));

create or replace function is_responsable_video(p_projet_id uuid, p_statut_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from projet_video_responsables
    where projet_id = p_projet_id and statut_id = p_statut_id and prestataire_id = current_prestataire_id()
  );
$$;

-- Le droit de modifier une vidéo dépend maintenant de la colonne où elle
-- se trouve (table ci-dessus) plutôt que d'un champ choisi à la main sur
-- la vidéo. Le "with check" reste large (juste "assigné au projet") pour
-- ne pas bloquer un prestataire qui fait avancer une carte vers une
-- colonne dont il n'est plus responsable une fois le déplacement effectué.
drop policy if exists videos_presta_update on videos;
create policy videos_presta_update on videos for update
  using (is_responsable_video(projet_id, statut_id))
  with check (is_prestataire_assigned(projet_id));

alter table videos drop column if exists prestataire_tournage_id;
alter table videos drop column if exists prestataire_montage_id;
alter table projets drop column if exists prestataire_tournage_defaut_id;
alter table projets drop column if exists prestataire_montage_defaut_id;

notify pgrst, 'reload schema';
