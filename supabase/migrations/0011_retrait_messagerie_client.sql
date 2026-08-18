-- La messagerie est un outil interne admin/prestataire : le client ne doit
-- avoir aucun accès (ni lecture ni écriture) à la table commentaires.
drop policy if exists commentaires_client_select on commentaires;
drop policy if exists commentaires_client_insert on commentaires;
