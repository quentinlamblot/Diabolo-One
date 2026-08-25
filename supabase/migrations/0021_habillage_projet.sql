-- Nouveaux champs "Habillage" au niveau du projet (une seule tâche par
-- projet, plus par vidéo) : fait/à faire, lien vers les fichiers sources,
-- date, et prestataire responsable (Gaspard la plupart du temps).
alter table projets add column if not exists habillage_fait boolean not null default false;
alter table projets add column if not exists habillage_lien text;
alter table projets add column if not exists habillage_date date;
alter table projets add column if not exists habillage_prestataire_id uuid references prestataires(id) on delete set null;

-- Retire "Habillage" du pipeline vidéo (Kanban) : les vidéos qui y étaient
-- avancent à l'étape suivante (l'habillage se suit désormais au niveau du
-- projet, plus par vidéo), puis la colonne est supprimée et les ordres
-- suivants sont resserrés pour ne pas laisser de trou.
do $$
declare
  v_habillage_id uuid;
  v_habillage_ordre int;
  v_suivant_id uuid;
begin
  select id, ordre into v_habillage_id, v_habillage_ordre
  from statuts where type = 'video' and label = 'Habillage'
  limit 1;

  if v_habillage_id is not null then
    select id into v_suivant_id
    from statuts
    where type = 'video' and ordre > v_habillage_ordre
    order by ordre asc
    limit 1;

    if v_suivant_id is not null then
      update videos set statut_id = v_suivant_id where statut_id = v_habillage_id;
    end if;

    delete from projet_video_responsables where statut_id = v_habillage_id;
    delete from statuts where id = v_habillage_id;

    update statuts set ordre = ordre - 1
    where type = 'video' and ordre > v_habillage_ordre;
  end if;
end $$;

notify pgrst, 'reload schema';
