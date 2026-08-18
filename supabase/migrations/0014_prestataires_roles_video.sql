-- Vidéos : distinguer le responsable du tournage de celui du montage (deux
-- prestataires différents peuvent intervenir sur la même vidéo, ex. Bruno
-- tourne, Hippolyte monte). Les affectations existantes sont conservées
-- comme responsable montage, le rôle dominant dans l'app jusqu'ici (tarifs
-- et paiements orientés monteur) ; à corriger manuellement si certaines
-- étaient en réalité des tourneurs.
alter table videos rename column prestataire_id to prestataire_montage_id;
alter table videos add column prestataire_tournage_id uuid references prestataires(id) on delete set null;

-- Prestataires par défaut par étape sur le projet, pour ne pas avoir à les
-- ressaisir vidéo par vidéo.
alter table projets add column prestataire_tournage_defaut_id uuid references prestataires(id) on delete set null;
alter table projets add column prestataire_montage_defaut_id uuid references prestataires(id) on delete set null;

drop policy if exists videos_presta_update on videos;
create policy videos_presta_update on videos for update
  using (prestataire_tournage_id = current_prestataire_id() or prestataire_montage_id = current_prestataire_id())
  with check (prestataire_tournage_id = current_prestataire_id() or prestataire_montage_id = current_prestataire_id());
