// Cartes à collectionner : dessin (SVG généré depuis la teinte et le motif de la carte) et rendu HTML.
import { esc } from './ui.js';

export const RARETES = { commune: 'Commune', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };
/** Hasard reproductible (même carte, même dessin). */
const hasard = (graine) => { let s = graine * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
/** Monogramme : initiales des mots importants (« Le Roi du barbecue » → RB). */
const mono = (nom) => nom.replace(/^(L'|Le |La |Les )/i, '').split(/[\s']+/).filter((m) => m.length > 2 || /^[A-ZÉ]/.test(m)).slice(0, 2).map((m) => m[0].toUpperCase()).join('');

/**
 * Illustration d'une carte (viewBox 100 × 100) : fond et motif dans sa teinte, pastille centrale avec ses initiales.
 * @param {{id:number, nom:string, teinte:number, motif:number}} c Carte.
 */
export function art(c) {
  const h = c.teinte, r = hasard(c.id);
  const fond = `hsl(${h} 78% 62%)`, clair = `hsl(${(h + 25) % 360} 95% 84%)`, fonce = `hsl(${h} 62% 30%)`, autre = `hsl(${(h + 180) % 360} 70% 60%)`;
  let motif = '';
  switch (c.motif) {
    case 0: for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; motif += `<path d="M50 50 L${50 + 90 * Math.cos(a)} ${50 + 90 * Math.sin(a)} L${50 + 90 * Math.cos(a + .18)} ${50 + 90 * Math.sin(a + .18)}Z" fill="${clair}" opacity=".55"/>`; } break;
    case 1: for (let y = -10; y < 110; y += 14) motif += `<path d="M-5 ${y} Q 12 ${y - 8} 30 ${y} T 65 ${y} T 100 ${y} T 135 ${y}" stroke="${clair}" stroke-width="5" fill="none" opacity=".7"/>`; break;
    case 2: for (let i = 0; i < 26; i++) motif += `<circle cx="${r() * 100}" cy="${r() * 100}" r="${2 + r() * 7}" fill="${i % 3 ? clair : autre}" opacity=".75"/>`; break;
    case 3: for (let x = -100; x < 120; x += 16) motif += `<path d="M${x} 0 L${x + 100} 100" stroke="${clair}" stroke-width="7" opacity=".5"/>`; break;
    case 4: for (let i = 0; i < 30; i++) { const x = r() * 100, y = r() * 100; motif += `<rect x="${x}" y="${y}" width="${4 + r() * 4}" height="2.6" rx="1" fill="${['#FE3104', '#FCA301', '#FBD32D', '#159946', '#2B5AE2', '#4E2398'][i % 6]}" transform="rotate(${r() * 180} ${x} ${y})"/>`; } break;
    default: for (let y = 0; y < 100; y += 12.5) for (let x = 0; x < 100; x += 12.5) if (((x + y) / 12.5) % 2 === 0) motif += `<rect x="${x}" y="${y}" width="12.5" height="12.5" fill="${clair}" opacity=".45"/>`;
  }
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="100" height="100" fill="${fond}"/>${motif}
    <circle cx="50" cy="54" r="24" fill="${fonce}"/><circle cx="50" cy="54" r="24" fill="none" stroke="#fff" stroke-width="3"/>
    <text x="50" y="55" text-anchor="middle" dominant-baseline="central" font-family="Rammetto One, sans-serif" font-size="${mono(c.nom).length > 1 ? 17 : 22}" fill="#fff">${esc(mono(c.nom))}</text></svg>`;
}

/**
 * Carte complète (cadre selon la rareté), ou dos « ? » si elle n'est pas encore trouvée.
 * @param {object} c Carte (tg_cartes).
 * @param {{cachee?: boolean, l?: number}} [o] cachee : pas encore dans la collection ; l : largeur en px.
 */
export function carteHtml(c, { cachee = false, l = null } = {}) {
  const taille = l ? ` style="--l:${l}px"` : '';
  const num = `#${String(c.id).padStart(2, '0')}`;
  if (cachee) return `<div class="carte est-cachee" data-r="${esc(c.rarete)}"${taille}><div class="carte-art">?</div><div class="carte-txt"><b>${num}</b><small>${esc(c.serie)} · ${RARETES[c.rarete]}</small></div></div>`;
  return `<div class="carte" data-r="${esc(c.rarete)}"${taille}>
      <div class="carte-art">${art(c)}<span class="carte-num">${num}</span><span class="carte-rar">${RARETES[c.rarete]}</span></div>
      <div class="carte-txt"><b>${esc(c.nom)}</b><i>${esc(c.texte)}</i><small>${esc(c.serie)}</small></div>
    </div>`;
}
