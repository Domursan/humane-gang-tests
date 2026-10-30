// Outils d'affichage partagés : échappement, client Supabase, avatars, icônes, dates, toasts.

const SUPABASE_URL = 'https://zqbdzokyhgavgmqgiwuw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Pnq8U6lmFw5qavh98y1HKQ_9mHs-YTm';
/** Client Supabase (script vendor/supabase-js chargé avant les modules). Session propre au site de test. */
export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: 'tg-session' } });

/** Échappe un texte pour le HTML. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/** Couleurs proposées pour un profil (traînée du logo, cœur, rose). */
export const COULEURS = ['#D7193B', '#F26A1B', '#E0A100', '#1E9E58', '#2D5BE3', '#6A3FC9', '#FF5D8F', '#4A3F4E'];
/** Pastille d'un membre : sa couleur et son initiale. */
export const ava = (p, t = 36) => `<span class="ava" style="--a:${esc(/^#[0-9a-f]{6}$/i.test(p?.couleur || '') ? p.couleur : '#4A3F4E')};--t:${t}px" aria-hidden="true">${esc((p?.pseudo || '?').trim().slice(0, 1).toUpperCase())}</span>`;

/** Message bref en bas de l'écran. */
export function toast(msg, erreur = false) {
  const t = document.createElement('div');
  t.className = `toast${erreur ? ' est-erreur' : ''}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
}
/** Message d'une erreur Supabase ou JS. */
export const msgErreur = (e) => e?.message || String(e);

const fr = (o) => new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', ...o });
const fJour = fr({ day: 'numeric' }), fMois = fr({ month: 'short' }), fLong = fr({ weekday: 'long', day: 'numeric', month: 'long' }), fHeure = fr({ hour: '2-digit', minute: '2-digit' });
export const jourNum = (d) => fJour.format(new Date(d));
export const moisCourt = (d) => fMois.format(new Date(d)).replace('.', '');
export const dateLongue = (d) => fLong.format(new Date(d));
export const heure = (d) => fHeure.format(new Date(d)).replace(':', ' h ');
/** « dans 3 jours », « demain », « aujourd'hui », « il y a 2 jours ». */
export function relatif(d) {
  const j = (x) => Math.floor((new Date(fr({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(x).split('.').reverse().join('-')) - 0) / 864e5);
  const n = j(new Date(d)) - j(new Date());
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  return n > 0 ? `dans ${n} jours` : `il y a ${-n} jours`;
}

/** Icônes à trait (24 × 24). */
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICO = {
  qg: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  sorties: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  cartes: svg('<rect x="4" y="5" width="11" height="15" rx="2"/><path d="M15 7.5l3.2.9a1.6 1.6 0 0 1 1.1 2l-2.6 9.3a1.6 1.6 0 0 1-2 1.1l-1.2-.3"/>'),
  jeux: svg('<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="13.5" r=".6" fill="currentColor"/>'),
  gang: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.7.2 5 2.5 5 5.3"/>'),
  lieu: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  heure: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  retour: svg('<path d="M15 6l-6 6 6 6"/>'),
};
/** Cœur plein (jeu Réflexe, décor de l'accueil). */
export const COEUR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-8.5-5.3-8.5-11.3A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 3.1C20.5 15.7 12 21 12 21z"/></svg>';

/** Rubriques (navigation) : chemin, nom, icône, couleur. */
export const RUBRIQUES = [
  { id: 'qg', href: '#/', nom: 'QG', c: 'var(--coeur)' },
  { id: 'sorties', href: '#/sorties', nom: 'Sorties', c: 'var(--orange)' },
  { id: 'cartes', href: '#/cartes', nom: 'Cartes', c: 'var(--jaune)', t: 'var(--encre)' },
  { id: 'jeux', href: '#/jeux', nom: 'Jeux', c: 'var(--vert)' },
  { id: 'gang', href: '#/gang', nom: 'Le gang', c: 'var(--bleu)' },
];
