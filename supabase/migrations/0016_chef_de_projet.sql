-- Chaque projet a un chef de projet (un prestataire), défini dès la
-- création : c'est lui qui est notifié quand le client remplit son brief
-- ou ajoute des contacts.
alter table projets add column if not exists chef_de_projet_id uuid references prestataires(id) on delete set null;

notify pgrst, 'reload schema';
