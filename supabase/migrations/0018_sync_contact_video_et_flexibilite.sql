-- Synchro contact -> vidéo (sens inverse de la synchro vidéo -> contact déjà
-- en place) : quand un contact atteint un statut mappé, sa vidéo liée doit
-- avancer (ou être créée si elle n'existe pas encore).
alter table statuts add column if not exists statut_video_lie_id uuid references statuts(id) on delete set null;

update statuts s
set statut_video_lie_id = (select id from statuts where type = 'video' and label = 'Booké' limit 1)
where s.type = 'interviewe' and s.label = 'Booké' and s.statut_video_lie_id is null;

update statuts s
set statut_video_lie_id = (select id from statuts where type = 'video' and label = 'En montage' limit 1)
where s.type = 'interviewe' and s.label = 'Tourné' and s.statut_video_lie_id is null;

-- Responsable par défaut global pour une colonne vidéo (Gestion > Statuts),
-- utilisé si le projet n'a pas défini son propre responsable pour cette
-- colonne dans projet_video_responsables.
alter table statuts add column if not exists responsable_defaut_id uuid references prestataires(id) on delete set null;

-- Colonnes personnalisées de Suivi des contacts : texte libre ou menu
-- déroulant avec une liste d'options définie à la création.
alter table interviewe_champs add column if not exists type text not null default 'texte';
alter table interviewe_champs add column if not exists options text[] not null default '{}';

-- Le format vidéo n'est plus une liste figée (16:9/9:16 uniquement) : texte
-- libre pour accepter "4:5" et toute autre valeur, le formulaire propose
-- toujours les formats courants + une option "Autre".
alter table projets alter column format type text using format::text;
alter table projets alter column format set default '16:9';

notify pgrst, 'reload schema';
