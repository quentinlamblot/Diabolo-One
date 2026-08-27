-- Le montant facturé au client sur un projet Diabolo classique se lit
-- directement sur le prix de l'offre associée (projets.offre_id →
-- offres.prix) plutôt que d'être ressaisi séparément : ce champ n'a jamais
-- été utilisé en pratique et n'est plus référencé dans le code.
alter table projets drop column if exists montant_facture;

notify pgrst, 'reload schema';
