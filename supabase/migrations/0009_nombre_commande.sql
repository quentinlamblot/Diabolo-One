-- Nombre de vidéos commandées sur le projet (contrat), distinct du nombre
-- de fiches vidéo effectivement créées dans le board. Sert à afficher
-- "commandées vs livrées" et à générer automatiquement les fiches vidéo
-- manquantes en statut "à tourner".
alter table projets add column nombre_commande integer not null default 0;
