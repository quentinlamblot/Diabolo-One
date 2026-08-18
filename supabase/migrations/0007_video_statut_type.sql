-- Étape 1/2 du board vidéo : ajoute la valeur 'video' au type énuméré
-- statut_type. Doit être exécutée seule : Postgres interdit d'utiliser une
-- nouvelle valeur d'enum dans la même transaction que celle qui l'ajoute,
-- d'où la séparation avec 0008_videos.sql.
alter type statut_type add value if not exists 'video';
