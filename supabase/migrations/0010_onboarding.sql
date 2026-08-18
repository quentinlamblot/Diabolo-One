-- ---------------------------------------------------------------------
-- Questionnaire d'onboarding client : rempli une fois par projet lors
-- de la première connexion du client, pré-remplit la fiche projet et
-- sert de brief consultable par l'admin.
-- ---------------------------------------------------------------------
create table onboarding_reponses (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null unique references projets(id) on delete cascade,
  reponses jsonb not null default '{}',
  submitted_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table onboarding_reponses enable row level security;

create policy onboarding_admin_all on onboarding_reponses for all using (is_admin()) with check (is_admin());
create policy onboarding_client_select on onboarding_reponses for select
  using (projet_belongs_to_current_client(projet_id));
create policy onboarding_client_insert on onboarding_reponses for insert
  with check (projet_belongs_to_current_client(projet_id));
