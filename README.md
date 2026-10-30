# Humane Gang — site de test

Copie du site de [humane-gang](https://github.com/Domursan/humane-gang) (dossier `site/`), publiée par GitHub Pages pour les tests :
https://domursan.github.io/humane-gang-tests/

- Les chemins absolus du site reçoivent le préfixe `/humane-gang-tests` (site servi dans un sous-dossier).
- Pas de fichier CNAME (il réclamerait humane-gang.com), pas d'indexation (robots.txt).
- **Le site de test parle à la vraie base Supabase** : se connecter, jouer, poster ou voter ici modifie la production.

Mettre à jour la copie (depuis ce dossier, à côté de « 0. Code ») : `bash synchroniser.sh`, puis commit et push.

## Design « Soirée » (30/10/2026)

Ce dépôt porte une proposition de design complète, repartie de zéro (le logo et les cartes de jeu sont inchangés) :
fond encre légèrement violet avec halos doux, surfaces arrondies, rouge du cœur pour les actions, or chaud pour les mises
en avant, arc-en-ciel en fins liserés ; titres en Bricolage Grotesque, texte en Inter ; barre de navigation flottante
translucide, et barre d'onglets en bas sur téléphone. Les couleurs des thèmes de saison sont dans
`assets/commun/core/theme-palettes.js` (la base ne choisit plus que le thème du jour, son logo et ses effets).
`synchroniser.sh` refuse désormais de tourner sans `--ecraser-le-design`.
