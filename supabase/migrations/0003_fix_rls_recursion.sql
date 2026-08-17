-- Correction : les policies de "projets" et "projet_prestataires" se
-- référençaient mutuellement via des sous-requêtes directes, provoquant
-- une "infinite recursion detected in policy for relation" côté Postgres.
-- On enveloppe ces vérifications croisées dans des fonctions SECURITY DEFINER
-- (qui contournent RLS) pour casser le cycle.

create or replace function is_prestataire_assigned(p_projet_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from projet_prestataires
    where projet_id = p_projet_id and prestataire_id = current_prestataire_id()
  );
$$;

create or replace function projet_belongs_to_current_client(p_projet_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from projets where id = p_projet_id and client_id = current_client_id()
  );
$$;

-- projets
drop policy if exists projets_presta_select on projets;
drop policy if exists projets_presta_update on projets;
create policy projets_presta_select on projets for select
  using (is_prestataire_assigned(id));
create policy projets_presta_update on projets for update
  using (is_prestataire_assigned(id));

-- projet_prestataires
drop policy if exists projet_prestataires_client_select on projet_prestataires;
create policy projet_prestataires_client_select on projet_prestataires for select
  using (projet_belongs_to_current_client(projet_id));

-- interviewes
drop policy if exists interviewes_presta_select on interviewes;
drop policy if exists interviewes_presta_update on interviewes;
create policy interviewes_presta_select on interviewes for select
  using (is_prestataire_assigned(projet_id));
create policy interviewes_presta_update on interviewes for update
  using (is_prestataire_assigned(projet_id));

drop policy if exists interviewes_client_select on interviewes;
drop policy if exists interviewes_client_insert on interviewes;
drop policy if exists interviewes_client_update on interviewes;
create policy interviewes_client_select on interviewes for select
  using (projet_belongs_to_current_client(projet_id));
create policy interviewes_client_insert on interviewes for insert
  with check (projet_belongs_to_current_client(projet_id));
create policy interviewes_client_update on interviewes for update
  using (projet_belongs_to_current_client(projet_id));
