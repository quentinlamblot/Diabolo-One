-- Statuts par défaut (modifiables ensuite par l'admin dans l'app)

insert into statuts (type, label, couleur, ordre) values
  ('projet', 'Nouveau', '#94a3b8', 0),
  ('projet', 'En cours', '#3b82f6', 1),
  ('projet', 'En attente client', '#f59e0b', 2),
  ('projet', 'Bloqué', '#ef4444', 3),
  ('projet', 'Terminé', '#22c55e', 4);

insert into statuts (type, label, couleur, ordre) values
  ('interviewe', 'À contacter', '#94a3b8', 0),
  ('interviewe', 'Contacté', '#3b82f6', 1),
  ('interviewe', 'Booké', '#8b5cf6', 2),
  ('interviewe', 'Tourné', '#22c55e', 3),
  ('interviewe', 'Annulé', '#ef4444', 4),
  ('interviewe', 'Ne répond pas', '#f59e0b', 5);
