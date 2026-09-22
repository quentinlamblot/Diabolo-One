-- Le lien Krock est désormais par vidéo (chaque interview a son propre
-- enregistrement) plutôt que par projet.
alter table videos add column if not exists lien_krock text;

-- Instructions individuelles fusionnées dans informations complémentaires
-- (un seul champ) : on concatène le contenu existant avant de retirer la
-- colonne devenue redondante, pour ne rien perdre.
update projets
set infos_complementaires = trim(both E'\n' from
  coalesce(infos_complementaires, '') ||
  case when instructions_individuelles is not null and instructions_individuelles <> ''
    then (case when coalesce(infos_complementaires, '') <> '' then E'\n\n' else '' end) || instructions_individuelles
    else '' end
)
where instructions_individuelles is not null and instructions_individuelles <> '';

alter table projets drop column if exists instructions_individuelles;
alter table projets drop column if exists lien_riverside;

notify pgrst, 'reload schema';
