-- ===== Site de test (humane-gang-tests) : tables « tg_ » =====
-- Base propre au nouveau site de test : profils, sorties et réponses, cartes à collectionner, booster du jour, scores des
-- jeux. Aucune table du vrai site n'est lue ni modifiée. Les comptes sont ceux de Supabase Auth (même projet) : un profil
-- tg_profils est créé au premier passage sur le site de test.
-- Lecture : membres connectés. Écriture : chacun ses lignes ; booster et scores seulement par RPC (security definer).
-- Rejouable. Pour tout retirer : drop table des tg_* et des fonctions tg_* (voir fin du fichier).

create table if not exists public.tg_profils (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null unique check (char_length(btrim(pseudo)) between 2 and 24),
  couleur text not null default '#D7193B' check (couleur ~ '^#[0-9A-Fa-f]{6}$'),
  cree_le timestamptz not null default now()
);

create table if not exists public.tg_sorties (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (char_length(btrim(titre)) between 2 and 80),
  lieu text not null default '' check (char_length(lieu) <= 80),
  description text not null default '' check (char_length(description) <= 600),
  debut timestamptz not null,
  cree_par uuid not null references public.tg_profils(id) on delete cascade,
  cree_le timestamptz not null default now()
);
create index if not exists tg_sorties_debut on public.tg_sorties (debut);
create index if not exists tg_sorties_cree_par on public.tg_sorties (cree_par);

create table if not exists public.tg_reponses (
  sortie_id uuid not null references public.tg_sorties(id) on delete cascade,
  user_id uuid not null references public.tg_profils(id) on delete cascade,
  reponse text not null check (reponse in ('oui', 'peut-etre', 'non')),
  maj_le timestamptz not null default now(),
  primary key (sortie_id, user_id)
);
create index if not exists tg_reponses_user on public.tg_reponses (user_id);

create table if not exists public.tg_cartes (
  id int primary key,
  nom text not null,
  serie text not null,
  rarete text not null check (rarete in ('commune', 'rare', 'epique', 'legendaire')),
  texte text not null default '',
  teinte int not null check (teinte between 0 and 359),
  motif int not null check (motif between 0 and 5)
);

create table if not exists public.tg_collection (
  user_id uuid not null references public.tg_profils(id) on delete cascade,
  carte_id int not null references public.tg_cartes(id) on delete cascade,
  quantite int not null default 1 check (quantite > 0),
  premiere_fois timestamptz not null default now(),
  primary key (user_id, carte_id)
);
create index if not exists tg_collection_carte on public.tg_collection (carte_id);

create table if not exists public.tg_boosters (
  user_id uuid not null references public.tg_profils(id) on delete cascade,
  jour date not null,
  cartes int[] not null,
  ouvert_le timestamptz not null default now(),
  primary key (user_id, jour)
);

create table if not exists public.tg_scores (
  id bigint generated always as identity primary key,
  jeu text not null check (jeu in ('memo', 'reflexe')),
  user_id uuid not null references public.tg_profils(id) on delete cascade,
  score int not null,
  jour date not null,
  cree_le timestamptz not null default now()
);
create index if not exists tg_scores_jeu_jour on public.tg_scores (jeu, jour);
create index if not exists tg_scores_user on public.tg_scores (user_id);

-- ---------- Droits ----------
alter table public.tg_profils enable row level security;
alter table public.tg_sorties enable row level security;
alter table public.tg_reponses enable row level security;
alter table public.tg_cartes enable row level security;
alter table public.tg_collection enable row level security;
alter table public.tg_boosters enable row level security;
alter table public.tg_scores enable row level security;
revoke all on public.tg_profils, public.tg_sorties, public.tg_reponses, public.tg_cartes, public.tg_collection, public.tg_boosters, public.tg_scores from anon;
revoke all on public.tg_profils, public.tg_sorties, public.tg_reponses, public.tg_cartes, public.tg_collection, public.tg_boosters, public.tg_scores from authenticated;
grant select on public.tg_profils, public.tg_sorties, public.tg_reponses, public.tg_cartes, public.tg_collection, public.tg_boosters, public.tg_scores to authenticated;
grant insert, update on public.tg_profils to authenticated;
grant insert, update, delete on public.tg_sorties to authenticated;
grant insert, update, delete on public.tg_reponses to authenticated;

do $p$ begin
  drop policy if exists tg_lecture on public.tg_profils;      create policy tg_lecture on public.tg_profils for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_sorties;      create policy tg_lecture on public.tg_sorties for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_reponses;     create policy tg_lecture on public.tg_reponses for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_cartes;       create policy tg_lecture on public.tg_cartes for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_collection;   create policy tg_lecture on public.tg_collection for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_boosters;     create policy tg_lecture on public.tg_boosters for select to authenticated using (true);
  drop policy if exists tg_lecture on public.tg_scores;       create policy tg_lecture on public.tg_scores for select to authenticated using (true);
  drop policy if exists tg_mon_profil on public.tg_profils;
  create policy tg_mon_profil on public.tg_profils for insert to authenticated with check (id = (select auth.uid()));
  drop policy if exists tg_mon_profil_maj on public.tg_profils;
  create policy tg_mon_profil_maj on public.tg_profils for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
  drop policy if exists tg_mes_sorties on public.tg_sorties;
  create policy tg_mes_sorties on public.tg_sorties for insert to authenticated with check (cree_par = (select auth.uid()));
  drop policy if exists tg_mes_sorties_maj on public.tg_sorties;
  create policy tg_mes_sorties_maj on public.tg_sorties for update to authenticated using (cree_par = (select auth.uid())) with check (cree_par = (select auth.uid()));
  drop policy if exists tg_mes_sorties_suppr on public.tg_sorties;
  create policy tg_mes_sorties_suppr on public.tg_sorties for delete to authenticated using (cree_par = (select auth.uid()));
  drop policy if exists tg_mes_reponses on public.tg_reponses;
  create policy tg_mes_reponses on public.tg_reponses for insert to authenticated with check (user_id = (select auth.uid()));
  drop policy if exists tg_mes_reponses_maj on public.tg_reponses;
  create policy tg_mes_reponses_maj on public.tg_reponses for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  drop policy if exists tg_mes_reponses_suppr on public.tg_reponses;
  create policy tg_mes_reponses_suppr on public.tg_reponses for delete to authenticated using (user_id = (select auth.uid()));
end $p$;

-- ---------- RPC ----------
/** Jour en cours à Zurich (booster et classements du jour). */
create or replace function public.tg_aujourdhui()
returns date language sql stable set search_path = public as $$ select (now() at time zone 'Europe/Zurich')::date $$;

/**
 * Booster du jour : 5 cartes tirées au sort (commune 70 %, rare 22 %, épique 7 %, légendaire 1 %), une fois par jour.
 * Renvoie { cartes: [{ id, nouvelle }] } ; déjà ouvert aujourd'hui : erreur.
 */
create or replace function public.tg_ouvrir_booster()
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); j date := tg_aujourdhui(); tirage int[] := '{}'; r float8; rar text; c int; res jsonb := '[]'; neuve boolean;
begin
  if me is null or not exists (select 1 from tg_profils where id = me) then raise exception 'Crée d''abord ton profil.'; end if;
  if exists (select 1 from tg_boosters where user_id = me and jour = j) then raise exception 'Booster déjà ouvert aujourd''hui : reviens demain !'; end if;
  for i in 1..5 loop
    r := random();
    rar := case when r < 0.01 then 'legendaire' when r < 0.08 then 'epique' when r < 0.30 then 'rare' else 'commune' end;
    select id into c from tg_cartes where rarete = rar order by random() limit 1;
    tirage := tirage || c;
    neuve := not exists (select 1 from tg_collection where user_id = me and carte_id = c);
    insert into tg_collection (user_id, carte_id) values (me, c)
      on conflict (user_id, carte_id) do update set quantite = tg_collection.quantite + 1;
    res := res || jsonb_build_object('id', c, 'nouvelle', neuve);
  end loop;
  insert into tg_boosters (user_id, jour, cartes) values (me, j, tirage);
  return jsonb_build_object('cartes', res);
end $$;

/** Score d'un jeu (plus petit = meilleur) : memo = nombre de coups (8 à 200), reflexe = temps moyen en ms (80 à 3000). */
create or replace function public.tg_enregistrer_score(p_jeu text, p_score int)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or not exists (select 1 from tg_profils where id = me) then raise exception 'Crée d''abord ton profil.'; end if;
  if p_jeu = 'memo' and p_score not between 8 and 200 then raise exception 'Score impossible.'; end if;
  if p_jeu = 'reflexe' and p_score not between 80 and 3000 then raise exception 'Score impossible.'; end if;
  if p_jeu not in ('memo', 'reflexe') then raise exception 'Jeu inconnu.'; end if;
  if (select count(*) from tg_scores where user_id = me and jeu = p_jeu and cree_le > now() - interval '1 minute') >= 10 then
    raise exception 'Doucement : trop de parties en une minute.';
  end if;
  insert into tg_scores (jeu, user_id, score, jour) values (p_jeu, me, p_score, tg_aujourdhui());
end $$;

revoke all on function public.tg_ouvrir_booster(), public.tg_enregistrer_score(text, int), public.tg_aujourdhui() from public, anon;
grant execute on function public.tg_ouvrir_booster(), public.tg_enregistrer_score(text, int), public.tg_aujourdhui() to authenticated;

-- ---------- Les 30 cartes (3 séries de 10 : 5 communes, 3 rares, 1 épique, 1 légendaire) ----------
insert into public.tg_cartes (id, nom, serie, rarete, texte, teinte, motif) values
  (1, 'L''Organisatrice', 'Le gang', 'legendaire', 'A déjà réservé la salle avant que tu dises oui.', 352, 0),
  (2, 'Le Retardataire', 'Le gang', 'commune', '« J''arrive dans 5 minutes. » (Il part de chez lui.)', 28, 1),
  (3, 'Le Roi du barbecue', 'Le gang', 'rare', 'Ne lâche jamais la pince.', 14, 2),
  (4, 'La DJ du salon', 'Le gang', 'epique', 'Prend le câble aux. Ne le rend pas.', 280, 3),
  (5, 'Le Photographe', 'Le gang', 'commune', 'Encore une. Celle-là, c''était flou.', 210, 4),
  (6, 'La Stratège', 'Le gang', 'rare', 'Gagne au jeu de société. Toujours.', 160, 5),
  (7, 'Le Dormeur de canapé', 'Le gang', 'commune', 'Ronfle dès 23 h 04.', 240, 1),
  (8, 'La Cheffe raclette', 'Le gang', 'rare', 'Connaît le fromage par son prénom.', 45, 0),
  (9, 'Le Conteur', 'Le gang', 'commune', '« Je vous ai déjà raconté ? » Oui.', 120, 2),
  (10, 'La Mascotte', 'Le gang', 'commune', 'Personne ne sait d''où elle vient.', 320, 3),
  (11, 'Soirée jeux de société', 'En soirée', 'commune', 'Trois heures d''explication des règles.', 200, 5),
  (12, 'Karaoké', 'En soirée', 'rare', 'Le micro sature. Personne ne s''arrête.', 300, 3),
  (13, 'Pizza partagée', 'En soirée', 'commune', 'La dernière part reste là. Par politesse.', 20, 2),
  (14, 'Quiz du jeudi', 'En soirée', 'commune', 'Trois points sur quarante. Fiers.', 180, 4),
  (15, 'Feu de camp', 'En soirée', 'epique', 'Guitare, deux accords, mille chansons.', 25, 1),
  (16, 'Dernier métro', 'En soirée', 'rare', 'Course finale, portes qui se ferment.', 230, 0),
  (17, 'Apéro improvisé', 'En soirée', 'commune', 'Prévu pour une heure. Fini à l''aube.', 50, 5),
  (18, 'Partie de cartes', 'En soirée', 'commune', 'Qui a battu ? Personne ne sait.', 140, 2),
  (19, 'Blind test', 'En soirée', 'rare', 'Trouvé en une note. Légendaire.', 270, 4),
  (20, 'Lever de soleil', 'En soirée', 'legendaire', 'On n''est pas allés se coucher.', 38, 3),
  (21, 'Road trip', 'En vadrouille', 'rare', 'Playlist de 14 heures. Il en reste 13.', 15, 4),
  (22, 'Rando dans la brume', 'En vadrouille', 'commune', 'La vue était belle, paraît-il.', 190, 1),
  (23, 'Plage en hiver', 'En vadrouille', 'commune', 'Bonnet, sable et thermos.', 205, 2),
  (24, 'Marché de Noël', 'En vadrouille', 'commune', 'Vin chaud dans une main, gaufre dans l''autre.', 0, 5),
  (25, 'Escape game', 'En vadrouille', 'rare', 'Sortis avec 12 secondes d''avance.', 260, 0),
  (26, 'Festival', 'En vadrouille', 'epique', 'Bracelet gardé six mois.', 310, 3),
  (27, 'Lac gelé', 'En vadrouille', 'commune', 'Personne n''a voulu tester la glace.', 195, 4),
  (28, 'Bowling', 'En vadrouille', 'commune', 'Quatre boules dans la rigole. D''affilée.', 100, 2),
  (29, 'Train de nuit', 'En vadrouille', 'rare', 'Couchette du haut, réveil à la frontière.', 250, 1),
  (30, 'Cabane en forêt', 'En vadrouille', 'legendaire', 'Pas de réseau. Meilleur week-end.', 130, 0)
on conflict (id) do update set nom = excluded.nom, serie = excluded.serie, rarete = excluded.rarete, texte = excluded.texte,
  teinte = excluded.teinte, motif = excluded.motif;

-- ---------- Tout retirer (à lancer à la main si on abandonne ce site de test) ----------
-- drop function if exists public.tg_ouvrir_booster(), public.tg_enregistrer_score(text, int), public.tg_aujourdhui();
-- drop table if exists public.tg_scores, public.tg_boosters, public.tg_collection, public.tg_cartes, public.tg_reponses, public.tg_sorties, public.tg_profils;
