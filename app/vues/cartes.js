// Rubrique « Cartes » : booster du jour (5 cartes, une fois par jour, RPC tg_ouvrir_booster), progression de la
// collection, les 30 cartes (trouvées ou « ? »), filtres par série, carte en grand avec ceux du gang qui l'ont aussi.
// Tables : tg_cartes, tg_collection, tg_boosters, tg_profils. Exporte afficher, etatCartes.
import { esc, $, $$, ava, toast, msgErreur, dateLongue } from '../ui.js';
import { carteHtml, RARETES } from '../carte.js';

/** Cartes, ma collection (id → ligne) et le booster du jour s'il est ouvert. */
export async function etatCartes(sb, moi) {
  const jour = await sb.rpc('tg_aujourdhui');
  if (jour.error) throw jour.error;
  const [c, col, b] = await Promise.all([
    sb.from('tg_cartes').select('*').order('id'),
    sb.from('tg_collection').select('*').eq('user_id', moi.id),
    sb.from('tg_boosters').select('*').eq('user_id', moi.id).eq('jour', jour.data).maybeSingle(),
  ]);
  for (const r of [c, col, b]) if (r.error) throw r.error;
  return { cartes: c.data, mienne: new Map(col.data.map((x) => [x.carte_id, x])), booster: b.data };
}

export async function afficher(main, ctx) {
  const e = await etatCartes(ctx.sb, ctx.moi);
  const parId = new Map(e.cartes.map((c) => [c.id, c]));
  let filtre = 'toutes';
  const series = [...new Set(e.cartes.map((c) => c.serie))];

  main.innerHTML = `<header class="entete"><div><span class="etiquette">Cartes</span><h1>La collection du gang</h1>
      <p>Trente cartes, trois séries. Un booster gratuit par jour : à toi de tout trouver.</p></div></header>
    <section class="booster" aria-labelledby="b-h">
      <div class="paquet" id="paquet"><img src="./img/logo-192.webp" alt=""></div>
      <div><h2 id="b-h">Booster du jour</h2><p id="b-txt"></p><p style="margin-top:16px" id="b-act"></p></div>
      <div class="tirage" id="tirage" aria-live="polite"></div>
    </section>
    <section aria-labelledby="c-h">
      <div class="bloc-titre"><h2 id="c-h">Ma collection</h2><b id="compte"></b></div>
      <div class="progression" style="margin-bottom:22px"><span id="barre"></span></div>
      <div class="filtres bascule" role="group" aria-label="Filtrer">
        <button type="button" data-f="toutes" aria-pressed="true">Toutes</button>
        ${series.map((s) => `<button type="button" data-f="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}
        <button type="button" data-f="manquantes" aria-pressed="false">Manquantes</button></div>
      <ul class="collection" id="grille" role="list"></ul>
    </section>
    <dialog class="fenetre" id="fenetre" aria-labelledby="fen-h"></dialog>`;

  const tirageHtml = (ids, neuves = []) => ids.map((id, i) => `<div class="emplacement">${carteHtml(parId.get(id))}${neuves[i] ? '<span class="nouvelle">Nouvelle !</span>' : ''}</div>`).join('');
  const poserDelais = () => $$('#tirage .carte').forEach((c, i) => c.style.setProperty('--d', `${i * 0.18}s`));
  const peindreBooster = () => {
    if (e.booster) {
      $('#b-txt').textContent = 'Ouvert aujourd’hui. Un nouveau booster t’attend demain.';
      $('#b-act').innerHTML = '';
      if (!$('#tirage').children.length) { $('#tirage').innerHTML = tirageHtml(e.booster.cartes); poserDelais(); }
    } else {
      $('#b-txt').textContent = '5 cartes au hasard : communes, rares, épiques… et peut-être une légendaire.';
      $('#b-act').innerHTML = '<button class="btn" type="button" id="ouvrir">Ouvrir le booster</button>';
    }
  };
  const peindreCollection = () => {
    const n = e.mienne.size;
    $('#compte').textContent = `${n} / ${e.cartes.length}`;
    $('#barre').style.width = `${(n / e.cartes.length) * 100}%`;
    const liste = e.cartes.filter((c) => filtre === 'toutes' || (filtre === 'manquantes' ? !e.mienne.has(c.id) : c.serie === filtre));
    $('#grille').innerHTML = liste.length ? liste.map((c) => {
      const m = e.mienne.get(c.id);
      return `<li>${m ? `<button type="button" data-carte="${c.id}" aria-label="${esc(c.nom)}, ${RARETES[c.rarete]}${m.quantite > 1 ? `, ${m.quantite} exemplaires` : ''}">${carteHtml(c)}</button>
        <span class="qte">${m.quantite > 1 ? `× ${m.quantite}` : '&nbsp;'}</span>` : `${carteHtml(c, { cachee: true })}<span class="qte">&nbsp;</span>`}</li>`;
    }).join('') : '<li class="vide" style="grid-column:1/-1">Tu as tout trouvé ici. Bravo !</li>';
  };
  peindreBooster();
  peindreCollection();

  main.addEventListener('click', async (ev) => {
    if (ev.target.closest('#ouvrir')) {
      const b = ev.target.closest('#ouvrir');
      b.disabled = true;
      $('#paquet').classList.add('tremble');
      const [{ data, error }] = await Promise.all([ctx.sb.rpc('tg_ouvrir_booster'), new Promise((r) => setTimeout(r, 1200))]);
      $('#paquet').classList.remove('tremble');
      if (error) { toast(msgErreur(error), true); b.disabled = false; return; }
      const ids = data.cartes.map((x) => x.id);
      e.booster = { cartes: ids };
      for (const x of data.cartes) { const m = e.mienne.get(x.id); e.mienne.set(x.id, m ? { ...m, quantite: m.quantite + 1 } : { carte_id: x.id, quantite: 1, premiere_fois: new Date().toISOString() }); }
      $('#tirage').innerHTML = tirageHtml(ids, data.cartes.map((x) => x.nouvelle));
      poserDelais();
      peindreBooster();
      peindreCollection();
      const neuves = data.cartes.filter((x) => x.nouvelle).length;
      toast(neuves ? `${neuves} nouvelle${neuves > 1 ? 's' : ''} carte${neuves > 1 ? 's' : ''} !` : 'Que des doubles… demain sera meilleur.');
      return;
    }
    const f = ev.target.closest('.filtres button');
    if (f) { filtre = f.dataset.f; $$('.filtres button').forEach((x) => x.setAttribute('aria-pressed', String(x === f))); peindreCollection(); return; }
    const c = ev.target.closest('[data-carte]');
    if (c) ouvrirCarte(ctx, parId.get(Number(c.dataset.carte)), e.mienne.get(Number(c.dataset.carte)), c);
  });
}

/** Carte en grand : texte, exemplaires, date de la première, et qui d'autre l'a. */
async function ouvrirCarte(ctx, c, m, retour) {
  const dlg = $('#fenetre');
  dlg.innerHTML = `<div class="fenetre-in">${carteHtml(c)}<div class="pile">
      <span class="etiquette">${esc(c.serie)} · ${RARETES[c.rarete]}</span>
      <h2 id="fen-h">${esc(c.nom)}</h2><p>${esc(c.texte)}</p>
      <p class="discret petit">${m.quantite > 1 ? `${m.quantite} exemplaires · ` : ''}trouvée le ${esc(dateLongue(m.premiere_fois))}</p>
      <div><h3 style="font-size:16px;margin-bottom:8px">Aussi chez</h3><div id="aussi" class="discret petit">…</div></div>
    </div></div><button class="fermer" type="button" aria-label="Fermer">×</button>`;
  dlg.showModal();
  dlg.querySelector('.fermer').onclick = () => dlg.close();
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  dlg.onclose = () => retour?.focus();
  const { data } = await ctx.sb.from('tg_collection').select('user_id, quantite, tg_profils(pseudo, couleur)').eq('carte_id', c.id).neq('user_id', ctx.moi.id);
  $('#aussi').innerHTML = data?.length
    ? `<div class="reponses"><ul>${data.map((x) => `<li>${ava(x.tg_profils, 28)}${esc(x.tg_profils.pseudo)}${x.quantite > 1 ? ` × ${x.quantite}` : ''}</li>`).join('')}</ul></div>`
    : 'Personne d’autre pour l’instant : elle est rare dans le gang !';
}
