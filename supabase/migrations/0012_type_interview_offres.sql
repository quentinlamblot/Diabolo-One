-- Type d'interview associé à chaque offre, utilisé pour calibrer la trame
-- générée par l'IA (courte = 4 questions, longue = 8 questions).
alter table offres add column type_interview text not null default 'courte' check (type_interview in ('longue', 'courte'));

update offres set type_interview = 'longue' where nom ilike '%premium%';
update offres set type_interview = 'courte' where nom ilike '%volume%';
