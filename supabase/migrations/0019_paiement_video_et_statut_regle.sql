-- Rattache une tâche de paiement à la vidéo qui l'a déclenchée (paiement
-- auto-généré du chef de projet à la livraison) pour éviter les doublons si
-- le statut vidéo repasse par "Livré", et ajoute un statut réglé/à régler.
alter table taches_prestataires add column if not exists video_id uuid references videos(id) on delete set null;
alter table taches_prestataires add column if not exists paye boolean not null default false;

notify pgrst, 'reload schema';
