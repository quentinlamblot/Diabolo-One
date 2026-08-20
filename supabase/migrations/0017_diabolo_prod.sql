-- Diabolo Prod : espace personnel de Quentin pour suivre ses projets
-- audiovisuels sur mesure (after-movie, interview, cadrage, montage...),
-- séparé du suivi client de Diabolo One mais réutilisant la même liste de
-- prestataires. Réservé aux comptes marqués "super admin" — un simple
-- indicateur sur profiles plutôt qu'un nouveau rôle, pour ne pas casser les
-- très nombreux contrôles `role !== "admin"` déjà répartis dans le code
-- (un super admin reste un admin standard partout ailleurs).
alter table profiles add column if not exists super_admin boolean not null default false;

create table if not exists prod_projets (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client text,
  type_prestation text,
  date_prestation date,
  statut text not null default 'a_venir', -- a_venir | en_cours | termine | annule
  valeur_deal numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Qui travaille sur le projet, combien on lui doit, et si c'est réglé
-- (date_paiement nulle = pas encore payé ; c'est la seule source de vérité,
-- pas de booléen séparé qui pourrait se désynchroniser).
create table if not exists prod_projet_prestataires (
  id uuid primary key default gen_random_uuid(),
  prod_projet_id uuid not null references prod_projets(id) on delete cascade,
  prestataire_id uuid not null references prestataires(id) on delete cascade,
  montant_du numeric(10,2),
  date_paiement date,
  created_at timestamptz not null default now(),
  unique (prod_projet_id, prestataire_id)
);

create index if not exists idx_prod_projet_prestataires_projet on prod_projet_prestataires(prod_projet_id);

alter table prod_projets enable row level security;
alter table prod_projet_prestataires enable row level security;

create or replace function is_super_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'admin' and super_admin from profiles where id = auth.uid()), false);
$$;

drop policy if exists prod_projets_super_admin_all on prod_projets;
create policy prod_projets_super_admin_all on prod_projets for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists prod_projet_prestataires_super_admin_all on prod_projet_prestataires;
create policy prod_projet_prestataires_super_admin_all on prod_projet_prestataires for all
  using (is_super_admin()) with check (is_super_admin());

notify pgrst, 'reload schema';
