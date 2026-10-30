// Rubrique « Sorties » : polaroïds des sorties à venir ou passées, réponse en un geste (J'y vais / Peut-être / Non),
// page d'une sortie (description, qui vient), proposer, modifier ou supprimer sa sortie.
// Tables : tg_sorties, tg_reponses, tg_profils. Exporte afficher, chargerSorties, polaroidHtml, brancherChoix.
import { esc, $, $$, ava, toast, msgErreur, ICO, jourNum, moisCourt, dateLongue, heure, relatif } from '../ui.js';

const FONDS = ['#F26A1B', '#D7193B', '#1E9E58', '#2D5BE3', '#6A3FC9', '#E0A100', '#FF5D8F'];
const ROTS = [-1.6, 1.2, -0.6, 1.8, -1.2, 0.8];
const LIBELLES = { oui: 'J’y vais', 'peut-etre': 'Peut-être', non: 'Non' };
const hash = (s) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Sorties (avec leurs réponses) et profils du gang, par id. */
export async function chargerSorties(sb, { aVenir = true, limite = 60 } = {}) {
  const maintenant = new Date(Date.now() - 6 * 3600e3).toISOString(); // une sortie reste « à venir » 6 h après son début
  let q = sb.from('tg_sorties').select('*, tg_reponses(user_id, reponse)').limit(limite);
  q = aVenir ? q.gte('debut', maintenant).order('debut') : q.lt('debut', maintenant).order('debut', { ascending: false });
  const [s, p] = await Promise.all([q, sb.from('tg_profils').select('id, pseudo, couleur')]);
  if (s.error) throw s.error;
  if (p.error) throw p.error;
  return { sorties: s.data, profils: new Map(p.data.map((x) => [x.id, x])) };
}

/** Pastilles « qui vient » et compte. */
function quiHtml(s, profils) {
  const oui = s.tg_reponses.filter((r) => r.reponse === 'oui').map((r) => profils.get(r.user_id)).filter(Boolean);
  const pe = s.tg_reponses.filter((r) => r.reponse === 'peut-etre').length;
  if (!oui.length && !pe) return '<span>Personne n’a encore répondu.</span>';
  return `<span class="avas">${oui.slice(0, 6).map((p) => ava(p, 32)).join('')}</span><span>${oui.length ? `${oui.length} y vont` : ''}${oui.length && pe ? ' · ' : ''}${pe ? `${pe} peut-être` : ''}</span>`;
}

/** Une sortie en polaroïd (le titre mène à sa page ; les boutons de réponse restent cliquables). */
export function polaroidHtml(s, profils, moi, { lien = true } = {}) {
  const h = hash(s.id), mien = s.tg_reponses.find((r) => r.user_id === moi.id)?.reponse;
  const passee = new Date(s.debut) < new Date(Date.now() - 6 * 3600e3);
  return `<article class="polaroid" data-sortie="${esc(s.id)}" style="--rot:${ROTS[h % ROTS.length]}deg">
      ${lien ? `<a class="lien-carte" href="#/sorties/${esc(s.id)}" aria-label="Voir la sortie : ${esc(s.titre)}"></a>` : ''}
      <div class="photo" style="--fond:linear-gradient(150deg, ${FONDS[h % FONDS.length]}, ${FONDS[(h + 3) % FONDS.length]})">
        <span class="date-gros"><b>${esc(jourNum(s.debut))}</b><span>${esc(moisCourt(s.debut))}</span></span>
        <h3>${esc(s.titre)}</h3>
      </div>
      <div class="polaroid-bas">
        <p class="infos"><span>${ICO.heure}${esc(heure(s.debut))} · ${esc(relatif(s.debut))}</span>${s.lieu ? `<span>${ICO.lieu}${esc(s.lieu)}</span>` : ''}</p>
        <p class="qui">${quiHtml(s, profils)}</p>
        ${passee ? '' : `<div class="choix" role="group" aria-label="Ma réponse pour ${esc(s.titre)}">
          ${Object.entries(LIBELLES).map(([r, l]) => `<button type="button" data-r="${r}" aria-pressed="${mien === r}">${l}</button>`).join('')}</div>`}
      </div>
    </article>`;
}

/**
 * Réponses en un geste dans un conteneur de polaroïds : même bouton = réponse retirée. Redessine la carte touchée.
 * @param {HTMLElement} box Conteneur.
 * @param {object} ctx Contexte (sb, moi).
 * @param {{sorties: object[], profils: Map}} d Données affichées (mises à jour sur place).
 * @param {Function} [apres] Rappelée après chaque réponse (ex. redessiner la page de la sortie).
 */
export function brancherChoix(box, ctx, d, apres = null) {
  box.addEventListener('click', async (e) => {
    const b = e.target.closest('.choix button');
    if (!b) return;
    const art = b.closest('[data-sortie]'), s = d.sorties.find((x) => x.id === art.dataset.sortie);
    const r = b.dataset.r, retirer = b.getAttribute('aria-pressed') === 'true';
    $$('.choix button', art).forEach((x) => { x.disabled = true; });
    const { error } = retirer
      ? await ctx.sb.from('tg_reponses').delete().match({ sortie_id: s.id, user_id: ctx.moi.id })
      : await ctx.sb.from('tg_reponses').upsert({ sortie_id: s.id, user_id: ctx.moi.id, reponse: r, maj_le: new Date().toISOString() });
    if (error) { toast(msgErreur(error), true); $$('.choix button', art).forEach((x) => { x.disabled = false; }); return; }
    s.tg_reponses = s.tg_reponses.filter((x) => x.user_id !== ctx.moi.id).concat(retirer ? [] : [{ user_id: ctx.moi.id, reponse: r }]);
    if (!retirer && r === 'oui') toast('Noté : tu y vas !');
    const lien = !!art.querySelector('.lien-carte');
    art.outerHTML = polaroidHtml(s, d.profils, ctx.moi, { lien });
    box.querySelector(`[data-sortie="${CSS.escape(s.id)}"] .choix button[data-r="${r}"]`)?.focus();
    apres?.();
  });
}

export async function afficher(main, ctx, params) {
  if (params[0] === 'nouvelle') return formulaire(main, ctx, null);
  if (params[0] === 'modifier' && params[1]) {
    const { data, error } = await ctx.sb.from('tg_sorties').select('*').eq('id', params[1]).maybeSingle();
    if (error) throw error;
    return formulaire(main, ctx, data);
  }
  if (params[0]) return detail(main, ctx, params[0]);
  return liste(main, ctx);
}

async function liste(main, ctx) {
  let aVenir = true;
  main.innerHTML = `<header class="entete"><div><span class="etiquette">Sorties</span><h1>On se voit quand ?</h1>
      <p>Les rendez-vous du gang. Dis en un geste si tu viens, ou propose la prochaine.</p></div>
      <a class="btn" href="#/sorties/nouvelle">${ICO.plus}Proposer une sortie</a></header>
    <div class="bascule" role="group" aria-label="Afficher" style="margin-bottom:26px">
      <button type="button" data-v="1" aria-pressed="true">À venir</button><button type="button" data-v="0" aria-pressed="false">Passées</button></div>
    <div id="liste"></div>`;
  const box = $('#liste');
  let d = { sorties: [], profils: new Map() };
  const dessiner = async () => {
    box.innerHTML = '<p class="chargement">Chargement…</p>';
    d = await chargerSorties(ctx.sb, { aVenir });
    box.innerHTML = d.sorties.length
      ? `<div class="sorties">${d.sorties.map((s) => polaroidHtml(s, d.profils, ctx.moi)).join('')}</div>`
      : `<p class="vide">${aVenir ? 'Rien de prévu pour l’instant. Lance la prochaine sortie !' : 'Pas encore de souvenirs ici.'}</p>`;
  };
  $('.bascule', main).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    aVenir = b.dataset.v === '1';
    $$('.bascule button', main).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    dessiner().catch((er) => toast(msgErreur(er), true));
  });
  brancherChoix(box, ctx, new Proxy({}, { get: (_, k) => d[k] }));
  await dessiner();
}

async function detail(main, ctx, id) {
  const [s, p] = await Promise.all([
    ctx.sb.from('tg_sorties').select('*, tg_reponses(user_id, reponse)').eq('id', id).maybeSingle(),
    ctx.sb.from('tg_profils').select('id, pseudo, couleur'),
  ]);
  if (s.error) throw s.error;
  if (!s.data) { main.innerHTML = '<p class="vide">Cette sortie n’existe plus.</p><p style="margin-top:16px"><a href="#/sorties">Toutes les sorties</a></p>'; return; }
  const d = { sorties: [s.data], profils: new Map(p.data.map((x) => [x.id, x])) };
  const sortie = s.data, auteur = d.profils.get(sortie.cree_par), mienne = sortie.cree_par === ctx.moi.id;
  const groupe = (r, titre) => {
    const qui = sortie.tg_reponses.filter((x) => x.reponse === r).map((x) => d.profils.get(x.user_id)).filter(Boolean);
    return qui.length ? `<h3>${titre} (${qui.length})</h3><ul>${qui.map((x) => `<li>${ava(x, 28)}${esc(x.pseudo)}</li>`).join('')}</ul>` : '';
  };
  const reponses = () => groupe('oui', 'Ils y vont') + groupe('peut-etre', 'Peut-être') + groupe('non', 'Pas cette fois') || '<p class="discret">Personne n’a encore répondu.</p>';
  main.innerHTML = `<p style="margin:8px 0 18px"><a class="btn btn-doux btn-petit" href="#/sorties">${ICO.retour}Toutes les sorties</a></p>
    <div class="detail">
      <div id="polaroid">${polaroidHtml(sortie, d.profils, ctx.moi, { lien: false })}</div>
      <div class="pile">
        <section class="bloc"><span class="etiquette">${esc(dateLongue(sortie.debut))}</span><h1 style="font-size:clamp(26px,4vw,36px)">${esc(sortie.titre)}</h1>
          <p class="infos" style="margin-top:12px"><span>${ICO.heure}${esc(heure(sortie.debut))}</span>${sortie.lieu ? `<span>${ICO.lieu}${esc(sortie.lieu)}</span>` : ''}</p>
          ${sortie.description ? `<p style="margin-top:14px;white-space:pre-line">${esc(sortie.description)}</p>` : ''}
          <p class="discret petit" style="margin-top:14px">Proposée par ${esc(auteur?.pseudo || 'quelqu’un')}</p>
          ${mienne ? `<p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><a class="btn btn-doux btn-petit" href="#/sorties/modifier/${esc(sortie.id)}">Modifier</a>
            <button class="btn btn-doux btn-petit" type="button" id="suppr">Supprimer</button></p>` : ''}</section>
        <section class="bloc reponses" aria-live="polite"><h2>Qui vient ?</h2><div id="reponses">${reponses()}</div></section>
      </div></div>`;
  brancherChoix($('#polaroid'), ctx, d, () => { $('#reponses').innerHTML = reponses(); });
  $('#suppr')?.addEventListener('click', async () => {
    if (!confirm(`Supprimer « ${sortie.titre} » ? Les réponses seront perdues.`)) return;
    const { error } = await ctx.sb.from('tg_sorties').delete().eq('id', sortie.id);
    if (error) { toast(msgErreur(error), true); return; }
    toast('Sortie supprimée.');
    location.hash = '#/sorties';
  });
}

/** Proposer (s = null) ou modifier une sortie. */
function formulaire(main, ctx, s) {
  const pad = (n) => String(n).padStart(2, '0');
  const dt = s ? new Date(s.debut) : new Date(Date.now() + 7 * 864e5);
  const jour = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const h = s ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : '19:00';
  main.innerHTML = `<p style="margin:8px 0 18px"><a class="btn btn-doux btn-petit" href="${s ? `#/sorties/${esc(s.id)}` : '#/sorties'}">${ICO.retour}Retour</a></p>
    <header class="entete"><div><span class="etiquette">Sorties</span><h1>${s ? 'Modifier la sortie' : 'Nouvelle sortie'}</h1></div></header>
    <form class="bloc form" id="f-sortie" style="max-width:640px">
      <label class="champ">Quoi ?<input name="titre" maxlength="80" required placeholder="Raclette chez Malik" value="${esc(s?.titre || '')}"></label>
      <div class="form-2"><label class="champ">Le<input type="date" name="jour" required value="${jour}"></label>
        <label class="champ">À<input type="time" name="heure" required value="${h}"></label></div>
      <label class="champ">Où ?<input name="lieu" maxlength="80" placeholder="Lausanne, chez Malik" value="${esc(s?.lieu || '')}"></label>
      <label class="champ">Les détails<textarea name="description" maxlength="600" placeholder="Qui apporte quoi, à quelle heure on part…">${esc(s?.description || '')}</textarea></label>
      <p class="erreur" id="f-err" role="alert" hidden></p>
      <p><button class="btn btn-rub" type="submit">${s ? 'Enregistrer' : 'Proposer au gang'}</button></p>
    </form>`;
  $('#f-sortie').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = $('#f-err');
    const ligne = { titre: String(f.get('titre')).trim(), lieu: String(f.get('lieu')).trim(), description: String(f.get('description')).trim(),
      debut: new Date(`${f.get('jour')}T${f.get('heure')}`).toISOString() };
    const r = s ? await ctx.sb.from('tg_sorties').update(ligne).eq('id', s.id).select().single()
      : await ctx.sb.from('tg_sorties').insert({ ...ligne, cree_par: ctx.moi.id }).select().single();
    if (r.error) { err.textContent = msgErreur(r.error); err.hidden = false; return; }
    if (!s) await ctx.sb.from('tg_reponses').insert({ sortie_id: r.data.id, user_id: ctx.moi.id, reponse: 'oui' });
    toast(s ? 'Sortie mise à jour.' : 'Sortie proposée au gang !');
    location.hash = `#/sorties/${r.data.id}`;
  });
}
