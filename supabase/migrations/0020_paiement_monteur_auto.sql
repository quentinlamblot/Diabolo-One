-- Tague la (les) colonne(s) du pipeline vidéo qui représentent le montage,
-- pour savoir automatiquement qui payer à la livraison (le responsable de
-- cette colonne pour le projet, comme pour les échéances).
alter table statuts add column if not exists est_etape_montage boolean not null default false;

-- Tarif monteur associé à une offre commerciale (vidéo premium ou
-- classique), pour appliquer automatiquement le bon montant à la livraison
-- plutôt que de le deviner.
alter table offres add column if not exists sous_type_monteur text;

notify pgrst, 'reload schema';
