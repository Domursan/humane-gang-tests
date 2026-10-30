// Rubrique « Jeux » : Mémo du gang (retrouver les 8 paires de cartes, en le moins de coups possible) et Réflexe (toucher
// le cœur dès qu'il devient rouge, moyenne de 5 essais). Scores par RPC tg_enregistrer_score ; classements du jour et de
// tous les temps (meilleur score de chacun, plus petit = meilleur). Tables : tg_scores, tg_profils, tg_cartes.
import { esc, $, $$, ava, toast, msgErreur, ICO, COEUR } from '../ui.js';
import { art } from '../carte.js';

const JEUX = {
  memo: { nom: 'Mémo du gang', c: 'var(--vert)', txt: 'Retrouve les 8 paires de cartes du gang. Moins de coups, meilleur score.', unite: (n) => `${n} coups` },
  reflexe: { nom: 'Réflexe', c: 'var(--violet)', txt: 'Touche le cœur dès qu’il devient rouge. Moyenne de 5 essais, en millisecondes.', unite: (n) => `${n} ms` },
};

/** Meilleur score de chacun (jour donné, ou tous les temps), du meilleur au moins bon. */
async function classement(sb, jeu, jour = null) {
  let q = sb.from('tg_scores').select('user_id, score, tg_profils(pseudo, couleur)').eq('jeu', jeu).order('score').limit(1000);
  if (jour) q = q.eq('jour', jour);
  const { data, error } = await q;
  if (error) throw error;
  const vus = new Map();
  for (const r of data) if (!vus.has(r.user_id)) vus.set(r.user_id, r);
  return [...vus.values()];
}
const classementHtml = (lignes, jeu, moi) => (lignes.length
  ? `<ol class="classement">${lignes.slice(0, 10).map((r) => `<li class="${r.user_id === moi.id ? 'moi-meme' : ''}">${ava(r.tg_profils, 30)}<span class="nom">${esc(r.tg_profils.pseudo)}</span><span class="val">${esc(JEUX[jeu].unite(r.score))}</span></li>`).join('')}</ol>`
  : '<p class="vide">Personne n’a encore joué. La première place est libre !</p>');

export async function afficher(main, ctx, params) {
  const jour = (await ctx.sb.rpc('tg_aujourdhui')).data;
  if (JEUX[params[0]]) return page(main, ctx, params[0], jour);
  const [m, r] = await Promise.all([classement(ctx.sb, 'memo', jour), classement(ctx.sb, 'reflexe', jour)]);
  const tuile = (id, l) => {
    const moi = l.find((x) => x.user_id === ctx.moi.id), tete = l[0];
    return `<a class="tuile-jeu" href="#/jeux/${id}" style="--c:${JEUX[id].c}">
        <h2>${JEUX[id].nom}</h2><p>${JEUX[id].txt}</p>
        <span class="record">${tete ? `En tête aujourd’hui : ${esc(tete.tg_profils.pseudo)}, ${esc(JEUX[id].unite(tete.score))}` : 'Personne n’a joué aujourd’hui'}${moi && moi !== tete ? ` · toi : ${esc(JEUX[id].unite(moi.score))}` : ''}</span></a>`;
  };
  main.innerHTML = `<header class="entete"><div><span class="etiquette">Jeux</span><h1>On joue ?</h1>
      <p>Deux jeux rapides, un classement du jour. Le meilleur score de chacun compte.</p></div></header>
    <div class="jeux">${tuile('memo', m)}${tuile('reflexe', r)}</div>`;
}

/** Page d'un jeu : zone de jeu à gauche, classement à droite (Aujourd'hui / Tous les temps). */
async function page(main, ctx, jeu, jour) {
  let periode = 'jour';
  main.innerHTML = `<p style="margin:8px 0 18px"><a class="btn btn-doux btn-petit" href="#/jeux">${ICO.retour}Tous les jeux</a></p>
    <header class="entete"><div><span class="etiquette">Jeux</span><h1>${JEUX[jeu].nom}</h1><p>${JEUX[jeu].txt}</p></div></header>
    <div class="zone-jeu"><section id="jeu" aria-label="Partie"></section>
      <section class="bloc" aria-labelledby="cl-h"><div class="bloc-titre"><h2 id="cl-h">Classement</h2></div>
        <div class="bascule" role="group" aria-label="Période" style="margin-bottom:14px">
          <button type="button" data-p="jour" aria-pressed="true">Aujourd’hui</button><button type="button" data-p="tout" aria-pressed="false">Tous les temps</button></div>
        <div id="classement" aria-live="polite"></div></section></div>`;
  const peindre = async () => { $('#classement').innerHTML = classementHtml(await classement(ctx.sb, jeu, periode === 'jour' ? jour : null), jeu, ctx.moi); };
  $('.bascule', main).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    periode = b.dataset.p;
    $$('.bascule button', main).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    peindre().catch((er) => toast(msgErreur(er), true));
  });
  const fini = async (score) => {
    const { error } = await ctx.sb.rpc('tg_enregistrer_score', { p_jeu: jeu, p_score: score });
    if (error) toast(msgErreur(error), true); else toast(`Score enregistré : ${JEUX[jeu].unite(score)}`);
    await peindre();
  };
  await peindre();
  if (jeu === 'memo') await memo($('#jeu'), ctx, fini); else reflexe($('#jeu'), fini);
}

/* ---------- Mémo du gang ---------- */
async function memo(box, ctx, fini) {
  const { data: cartes, error } = await ctx.sb.from('tg_cartes').select('id, nom, teinte, motif');
  if (error) throw error;
  const melange = (t) => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const partie = () => {
    const choix = melange(cartes).slice(0, 8), tuiles = melange([...choix, ...choix]);
    let ouvertes = [], coups = 0, paires = 0, bloque = false;
    box.innerHTML = `<div class="compteurs"><span class="compteur" id="coups">0 coup</span><span class="compteur" id="paires">0 / 8 paires</span></div>
      <div class="memo">${tuiles.map((c, i) => `<button type="button" data-i="${i}" aria-label="Carte ${i + 1}, cachée"><span class="face">
        <span class="dos"><img src="./img/logo-192.webp" alt=""></span><span class="devant">${art(c)}</span></span></button>`).join('')}</div>
      <p class="discret petit" style="text-align:center;margin-top:14px" id="memo-msg">Retourne deux cartes pour trouver une paire.</p>`;
    box.querySelector('.memo').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || bloque || b.classList.contains('vue') || b.classList.contains('trouvee')) return;
      const c = tuiles[b.dataset.i];
      b.classList.add('vue'); b.setAttribute('aria-label', `${c.nom}`);
      ouvertes.push(b);
      if (ouvertes.length < 2) return;
      coups += 1;
      $('#coups').textContent = `${coups} coup${coups > 1 ? 's' : ''}`;
      const [a, d] = ouvertes; ouvertes = [];
      if (tuiles[a.dataset.i].id === tuiles[d.dataset.i].id) {
        a.classList.add('trouvee'); d.classList.add('trouvee'); paires += 1;
        $('#paires').textContent = `${paires} / 8 paires`;
        $('#memo-msg').textContent = `Paire : ${c.nom} !`;
        if (paires === 8) {
          $('#memo-msg').innerHTML = `Bravo, terminé en <b>${coups} coups</b>. <button class="btn btn-petit" type="button" id="rejouer">Rejouer</button>`;
          $('#rejouer').onclick = partie;
          fini(coups);
        }
      } else {
        bloque = true;
        setTimeout(() => { for (const x of [a, d]) { x.classList.remove('vue'); x.setAttribute('aria-label', `Carte ${Number(x.dataset.i) + 1}, cachée`); } bloque = false; }, 800);
      }
    });
  };
  partie();
}

/* ---------- Réflexe ---------- */
function reflexe(box, fini) {
  const ESSAIS = 5;
  let etat = 'repos', temps = [], t0 = 0, minuteur = 0;
  box.innerHTML = `<button type="button" class="reflexe" id="zone" data-etat="repos">
      <span class="gros-coeur">${COEUR}</span><span id="r-msg">Touche pour commencer</span><span class="petit" id="r-sous" style="opacity:.8">5 essais · touche dès que le cœur devient rouge</span></button>`;
  const zone = $('#zone'), msg = $('#r-msg'), sous = $('#r-sous');
  const poser = (e, m, s = '') => { etat = e; zone.dataset.etat = e; msg.textContent = m; sous.textContent = s; };
  const attendre = () => {
    poser('attente', 'Attends le rouge…', `Essai ${temps.length + 1} sur ${ESSAIS}`);
    minuteur = setTimeout(() => { poser('go', 'Maintenant !', `Essai ${temps.length + 1} sur ${ESSAIS}`); t0 = performance.now(); }, 1200 + Math.random() * 2300);
  };
  const toucher = () => {
    if (etat === 'repos' || etat === 'fin') { temps = []; attendre(); return; }
    if (etat === 'attente') { clearTimeout(minuteur); poser('trop-tot', 'Trop tôt !', 'Cet essai recommence…'); setTimeout(attendre, 1100); return; }
    if (etat === 'go') {
      const ms = Math.round(performance.now() - t0);
      temps.push(ms);
      if (temps.length < ESSAIS) { poser('pause', `${ms} ms`, 'Essai suivant…'); setTimeout(attendre, 900); return; }
      const moy = Math.round(temps.reduce((a, b) => a + b, 0) / ESSAIS);
      poser('fin', `Moyenne : ${moy} ms`, `${temps.join(' · ')} ms — touche pour rejouer`);
      fini(Math.min(3000, Math.max(80, moy)));
    }
  };
  zone.addEventListener('pointerdown', (e) => { e.preventDefault(); toucher(); });
  zone.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); toucher(); } });
}
