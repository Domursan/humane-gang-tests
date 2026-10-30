// Palettes du design « Soirée » (site de test) : les couleurs du site viennent d'ici, plus de la base.
/*
 * Rôle : donne, pour chaque thème (slug de hg_themes), les six couleurs de base du design « Soirée ». Le thème du jour
 * reste choisi par la base (dates, thème forcé, logo, effets, emojis) ; seules ses couleurs sont remplacées par celles-ci.
 * Un thème inconnu prend la palette Classique. Clés : accent (actions), bg (fond), surface (cartes), text, muted
 * (texte discret), highlight (mises en avant, --sand).
 * Exporte : PALETTES, paletteDe.
 */

/** Palettes par slug de thème. */
export const PALETTES = Object.freeze({
  classique: { accent: '#E0234E', bg: '#0E0B13', surface: '#17131E', text: '#F6F1EA', muted: '#ABA4B8', highlight: '#FFC857' },
  halloween: { accent: '#F26B1D', bg: '#0C0908', surface: '#18120E', text: '#F7EDE2', muted: '#B5A595', highlight: '#C6F36B' },
  noel: { accent: '#D7263D', bg: '#090F0C', surface: '#121B16', text: '#F4F1E8', muted: '#A8B3AA', highlight: '#F2C14E' },
  'saint-nicolas': { accent: '#E23A3A', bg: '#0C1230', surface: '#151E45', text: '#FBF6EC', muted: '#C1C9E0', highlight: '#F2C14E' },
  hiver: { accent: '#5B8DEF', bg: '#090C13', surface: '#111725', text: '#EEF2F8', muted: '#A3ADBF', highlight: '#BFE3FF' },
  printemps: { accent: '#E85D9A', bg: '#0C0F0C', surface: '#141A15', text: '#F3F5EE', muted: '#A9B3A5', highlight: '#B6E388' },
  paques: { accent: '#9B7BE0', bg: '#0E0C13', surface: '#18151F', text: '#F4F1F8', muted: '#ADA6BA', highlight: '#F7D774' },
  ete: { accent: '#FF6B3D', bg: '#0F0C09', surface: '#1A1510', text: '#FBF3EA', muted: '#B8AB9B', highlight: '#FFD166' },
  automne: { accent: '#D9622B', bg: '#0E0B09', surface: '#191410', text: '#F4EDE4', muted: '#B1A597', highlight: '#E9B44C' },
  raclette: { accent: '#E8A400', bg: '#110C07', surface: '#1D150D', text: '#FBF1DE', muted: '#C2B096', highlight: '#FFD66B' },
  'pate-saucisse': { accent: '#C8262C', bg: '#1E0F08', surface: '#2E1A10', text: '#FFF4E0', muted: '#E0C7A6', highlight: '#F2B441' },
});

/**
 * Palette d'un thème (celle de Classique pour un thème inconnu).
 * @param {object|null} t Thème (slug).
 * @returns {object} Couleurs { accent, bg, surface, text, muted, highlight }.
 */
export const paletteDe = (t) => PALETTES[t?.slug] || PALETTES.classique;
