-- Suivi financier global (Diabolo classique + Diabolo Prod) : côté créance
-- client, même logique que le paiement prestataire déjà en place ailleurs
-- (date_paiement nulle = pas encore réglé, pas de booléen séparé qui
-- pourrait se désynchroniser).
alter table projets add column if not exists montant_facture numeric(10,2);
alter table projets add column if not exists date_paiement_client date;

alter table prod_projets add column if not exists date_paiement_client date;

notify pgrst, 'reload schema';
