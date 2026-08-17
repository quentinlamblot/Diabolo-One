-- =========================================================================
-- Gestion Projet — schéma initial
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type user_role as enum ('admin', 'prestataire', 'client');
create type format_type as enum ('16:9', '9:16', '16:9 et 9:16');
create type charte_status as enum ('ok', 'en_attente');
create type statut_type as enum ('projet', 'interviewe');

-- ---------------------------------------------------------------------
-- Statuts configurables (couleur + libellé définis par l'admin)
-- Utilisés à la fois pour le statut client d'un projet et le statut
-- d'un interviewé.
-- ---------------------------------------------------------------------
create table statuts (
  id uuid primary key default gen_random_uuid(),
  type statut_type not null,
  label text not null,
  couleur text not null default '#94a3b8', -- hex color
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text,
  telephone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Prestataires
-- ---------------------------------------------------------------------
create table prestataires (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text,
  telephone text,
  taux_horaire numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Offres
-- ---------------------------------------------------------------------
create table offres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  prix numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Profils utilisateurs (miroir de auth.users + rôle applicatif)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'client',
  client_id uuid references clients(id) on delete set null,
  prestataire_id uuid references prestataires(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Projets
-- ---------------------------------------------------------------------
create table projets (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client_id uuid not null references clients(id) on delete cascade,
  offre_id uuid references offres(id) on delete set null,
  format format_type not null default '16:9',
  duree_moyenne text, -- ex: "60-90s"
  infos_complementaires text,
  statut_id uuid references statuts(id) on delete set null,
  charte_graphique charte_status not null default 'en_attente',
  nombre_prevu integer not null default 0,
  nombre_booke integer not null default 0,
  nombre_tourne integer not null default 0,
  nombre_a_monter integer not null default 0,
  nombre_termine integer not null default 0,
  instructions_individuelles text,
  lien_edito text,
  lien_riverside text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Affectation des prestataires à un projet (many-to-many)
-- ---------------------------------------------------------------------
create table projet_prestataires (
  projet_id uuid not null references projets(id) on delete cascade,
  prestataire_id uuid not null references prestataires(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (projet_id, prestataire_id)
);

-- ---------------------------------------------------------------------
-- Interviewés (personnes à contacter/interviewer pour un projet)
-- ---------------------------------------------------------------------
create table interviewes (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  nom text not null,
  prenom text,
  email text,
  telephone text,
  statut_id uuid references statuts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Suivi des tâches / paiements par prestataire et par mois
-- ---------------------------------------------------------------------
create table taches_prestataires (
  id uuid primary key default gen_random_uuid(),
  prestataire_id uuid not null references prestataires(id) on delete cascade,
  projet_id uuid references projets(id) on delete set null,
  mois date not null, -- toujours stocké au 1er du mois
  description text not null,
  montant numeric(10,2) not null default 0,
  date_tache date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_projets_client on projets(client_id);
create index idx_interviewes_projet on interviewes(projet_id);
create index idx_taches_presta_mois on taches_prestataires(prestataire_id, mois);

-- =========================================================================
-- Helpers pour les policies RLS (SECURITY DEFINER pour éviter la récursion)
-- =========================================================================
create or replace function current_role_app() returns user_role
language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_client_id() returns uuid
language sql security definer stable set search_path = public as $$
  select client_id from profiles where id = auth.uid();
$$;

create or replace function current_prestataire_id() returns uuid
language sql security definer stable set search_path = public as $$
  select prestataire_id from profiles where id = auth.uid();
$$;

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- Auto-création du profil à l'inscription (rôle par défaut: client)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================================
-- RLS
-- =========================================================================
alter table statuts enable row level security;
alter table clients enable row level security;
alter table prestataires enable row level security;
alter table offres enable row level security;
alter table profiles enable row level security;
alter table projets enable row level security;
alter table projet_prestataires enable row level security;
alter table interviewes enable row level security;
alter table taches_prestataires enable row level security;

-- statuts: tout utilisateur connecté peut lire, seul l'admin gère
create policy statuts_select on statuts for select using (auth.uid() is not null);
create policy statuts_write on statuts for all using (is_admin()) with check (is_admin());

-- offres: lecture pour tous les connectés, écriture admin seule
create policy offres_select on offres for select using (auth.uid() is not null);
create policy offres_write on offres for all using (is_admin()) with check (is_admin());

-- clients: admin full; client peut voir sa propre fiche
create policy clients_admin_all on clients for all using (is_admin()) with check (is_admin());
create policy clients_self_select on clients for select
  using (id = current_client_id());

-- prestataires: admin full; prestataire peut voir sa propre fiche
create policy prestataires_admin_all on prestataires for all using (is_admin()) with check (is_admin());
create policy prestataires_self_select on prestataires for select
  using (id = current_prestataire_id());

-- profiles: admin full; chacun voit/modifie son propre profil
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());
create policy profiles_self_select on profiles for select using (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- projets: admin full
create policy projets_admin_all on projets for all using (is_admin()) with check (is_admin());
-- prestataire: select + update sur les projets où il est affecté
create policy projets_presta_select on projets for select using (
  exists (
    select 1 from projet_prestataires pp
    where pp.projet_id = projets.id and pp.prestataire_id = current_prestataire_id()
  )
);
create policy projets_presta_update on projets for update using (
  exists (
    select 1 from projet_prestataires pp
    where pp.projet_id = projets.id and pp.prestataire_id = current_prestataire_id()
  )
);
-- client: select sur ses propres projets
create policy projets_client_select on projets for select using (client_id = current_client_id());

-- projet_prestataires: admin full; prestataire voit ses propres affectations
create policy projet_prestataires_admin_all on projet_prestataires for all using (is_admin()) with check (is_admin());
create policy projet_prestataires_presta_select on projet_prestataires for select
  using (prestataire_id = current_prestataire_id());
create policy projet_prestataires_client_select on projet_prestataires for select
  using (exists (select 1 from projets p where p.id = projet_id and p.client_id = current_client_id()));

-- interviewes: admin full
create policy interviewes_admin_all on interviewes for all using (is_admin()) with check (is_admin());
-- prestataire: select + update sur les interviewés des projets affectés
create policy interviewes_presta_select on interviewes for select using (
  exists (
    select 1 from projet_prestataires pp
    where pp.projet_id = interviewes.projet_id and pp.prestataire_id = current_prestataire_id()
  )
);
create policy interviewes_presta_update on interviewes for update using (
  exists (
    select 1 from projet_prestataires pp
    where pp.projet_id = interviewes.projet_id and pp.prestataire_id = current_prestataire_id()
  )
);
-- client: select + insert + update sur les interviewés de ses projets (il "remplit" les contacts)
create policy interviewes_client_select on interviewes for select using (
  exists (select 1 from projets p where p.id = interviewes.projet_id and p.client_id = current_client_id())
);
create policy interviewes_client_insert on interviewes for insert with check (
  exists (select 1 from projets p where p.id = interviewes.projet_id and p.client_id = current_client_id())
);
create policy interviewes_client_update on interviewes for update using (
  exists (select 1 from projets p where p.id = interviewes.projet_id and p.client_id = current_client_id())
);

-- taches_prestataires: admin full; prestataire lit ses propres lignes
create policy taches_admin_all on taches_prestataires for all using (is_admin()) with check (is_admin());
create policy taches_presta_select on taches_prestataires for select
  using (prestataire_id = current_prestataire_id());
