-- Catégorie couleur (vert/orange/rouge) sur les statuts, pour teinter toute la ligne
alter table statuts add column categorie text check (categorie in ('vert', 'orange', 'rouge'));

-- Valeurs par défaut sur les statuts d'interviewé déjà seedés
update statuts set categorie = 'orange' where type = 'interviewe' and label in ('À contacter', 'Contacté', 'Ne répond pas');
update statuts set categorie = 'vert' where type = 'interviewe' and label in ('Booké', 'Tourné');
update statuts set categorie = 'rouge' where type = 'interviewe' and label = 'Annulé';

-- Date du rendez-vous
alter table interviewes add column date_rdv date;

-- Colonnes personnalisées (définition + valeurs en jsonb sur chaque interviewé)
create table interviewe_champs (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table interviewe_champs enable row level security;
create policy interviewe_champs_select on interviewe_champs for select using (auth.uid() is not null);
create policy interviewe_champs_write on interviewe_champs for all using (is_admin()) with check (is_admin());

alter table interviewes add column custom_fields jsonb not null default '{}'::jsonb;
