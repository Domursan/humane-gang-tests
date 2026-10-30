# Humane Gang — site de test (« le carnet du gang »)

Proposition de site refait de zéro, en ligne sur https://domursan.github.io/humane-gang-tests/ (GitHub Pages).
Seuls repères gardés : un site entre amis pour organiser des sorties, collectionner des cartes et jouer en ligne, et le logo.

## Ce qu'il contient

- **QG (accueil)** : bonjour, raccourcis vers les rubriques, prochaine sortie (réponse en un geste), fil du gang.
- **Sorties** : polaroïds des sorties à venir ou passées, « J'y vais / Peut-être / Non », page d'une sortie, proposer,
  modifier ou supprimer la sienne.
- **Cartes** : 30 cartes en 3 séries, un booster gratuit de 5 cartes par jour, collection, carte en grand et qui l'a.
- **Jeux** : Mémo du gang (8 paires, en le moins de coups) et Réflexe (toucher le cœur dès qu'il devient rouge), avec
  classement du jour et de tous les temps.
- **Le gang** : les membres, mon profil (pseudo, couleur), déconnexion.

## Technique

- Site statique sans construction : `index.html`, `style/site.css`, modules `app/` (une vue par rubrique dans
  `app/vues/`, navigation par ancre `#/sorties`). Polices Google : Rammetto One (titres) et Lexend (texte).
- Connexion avec les comptes Supabase existants (mêmes identifiants que humane-gang.com, session à part).
- Données dans des tables **propres au site de test**, préfixées `tg_` (`supabase/tg_schema.sql`) : aucune table du vrai
  site n'est lue ni modifiée. Le booster et les scores passent par des fonctions (`tg_ouvrir_booster`,
  `tg_enregistrer_score`) ; chacun ne peut écrire que ses propres sorties et réponses.
- `sw.js` ne sert qu'à désinstaller le service worker de l'ancienne copie du site et à vider son cache.
- L'ancienne copie du site (design « Soirée ») reste dans l'historique git (commit cf4e1d3).
