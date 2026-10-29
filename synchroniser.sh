#!/usr/bin/env bash
# ===== Humane Gang — copie de test du site pour GitHub Pages (dépôt humane-gang-tests) =====
# Recopie le site du dépôt principal (dossier site/ de « 0. Code ») à la racine de ce dépôt, pour GitHub Pages.
# Le site de test est servi dans un sous-dossier (https://domursan.github.io/humane-gang-tests/) : les chemins absolus
# du site (/assets/…, /pages/…, /sw.js…) reçoivent ce préfixe. Le fichier CNAME n'est pas recopié (il réclamerait
# humane-gang.com). Le site de test parle à la vraie base Supabase : ce qu'on y fait modifie la production.
# Usage (depuis ce dossier) : bash synchroniser.sh [dossier site/ du dépôt principal]
set -euo pipefail

SOURCE="${1:-../0. Code/site}"
PREFIXE="/humane-gang-tests"
ICI="$(cd "$(dirname "$0")" && pwd)"

[ -f "$SOURCE/index.html" ] || { echo "Dossier du site introuvable : $SOURCE" >&2; exit 1; }

# 1. Ancienne copie retirée (on garde .git, ce script et le README), puis nouvelle copie sans CNAME
find "$ICI" -mindepth 1 -maxdepth 1 ! -name .git ! -name synchroniser.sh ! -name README.md -exec rm -rf {} +
cp -r "$SOURCE"/. "$ICI"/
rm -f "$ICI/CNAME"

# 2. Chemins absolus du site préfixés (fichiers texte seulement)
find "$ICI" -path "$ICI/.git" -prune -o -type f \( -name '*.html' -o -name '*.js' -o -name '*.mjs' -o -name '*.css' -o -name '*.json' -o -name '*.webmanifest' \) -print0 |
  xargs -0 sed -i -E \
    -e "s#([\"'\`(=])/(assets|pages|sw\.js|manifest\.webmanifest|offline\.html|index\.html|404\.html|affiches)([/\"'\`)?\#.]|$)#\1${PREFIXE}/\2\3#g" \
    -e "s#href=\"/\"#href=\"${PREFIXE}/\"#g"

# 3. Pas de traitement Jekyll ; pas d'indexation par les moteurs de recherche
touch "$ICI/.nojekyll"
printf 'User-agent: *\nDisallow: /\n' > "$ICI/robots.txt"

echo "Copie faite depuis $SOURCE (préfixe $PREFIXE)."
