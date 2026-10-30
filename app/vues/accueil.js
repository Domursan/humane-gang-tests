// Accueil (QG) : bonjour, raccourcis vivants vers les rubriques, prochaine sortie (réponse en un geste) et fil du gang
// (cartes trouvées, sorties proposées, records du jour).
import { esc, $, ava, ICO, COEUR, relatif } from '../ui.js';
import { chargerSorties, polaroidHtml, brancherChoix } from './sorties.js';
import { etatCartes } from './cartes.js';
import { art, RARETES } from '../carte.js';

export async function afficher(main, ctx) {
  const [s, c, fil, scores] = await Promise.all([
    chargerSorties(ctx.sb, { aVenir: true, limite: 20 }),
    etatCartes(ctx.sb, ctx.moi),
    Promise.all([
      ctx.sb.from('tg_collection').select('premiere_fois, user_id, tg_profils(pseudo, couleur), tg_cartes(*)').order('premiere_fois', { ascending: false }).limit(8),
      ctx.sb.from('tg_sorties').select('id, titre, debut, cree_le, tg_profils(pseudo, couleur)').order('cree_le', { ascending: false }).limit(5),
    ]),
    ctx.sb.rpc('tg_aujourdhui').then(({ data }) => ctx.sb.from('tg_scores').select('jeu, score').eq('jour', data).eq('user_id', ctx.moi.id)),
  ]);
  const prochaine = s.sorties[0];
  const mesSorties = s.sorties.filter((x) => x.tg_reponses.some((r) => r.user_id === ctx.moi.id && r.reponse === 'oui')).length;
  const joues = new Set((scores.data || []).map((x) => x.jeu)).size;
  const resume = prochaine
    ? `Prochaine sortie ${relatif(prochaine.debut)} : ${prochaine.titre}.`
    : 'Rien de prévu pour l’instant : et si tu lançais la prochaine sortie ?';

  const evenements = [
    ...(fil[0].data || []).map((x) => ({ quand: x.premiere_fois, html: `<span class="mini-carte">${art(x.tg_cartes)}</span>
      <span><b>${esc(x.tg_profils.pseudo)}</b> a trouvé <b>${esc(x.tg_cartes.nom)}</b> <span class="discret">(${RARETES[x.tg_cartes.rarete].toLowerCase()})</span></span>` })),
    ...(fil[1].data || []).map((x) => ({ quand: x.cree_le, html: `${ava(x.tg_profils, 38)}<span><b>${esc(x.tg_profils.pseudo)}</b> propose <a href="#/sorties/${esc(x.id)}">${esc(x.titre)}</a>
      <span class="discret">(${esc(relatif(x.debut))})</span></span>` })),
  ].sort((a, b) => new Date(b.quand) - new Date(a.quand)).slice(0, 8);

  main.innerHTML = `<section class="salut">
      <div class="salut-texte"><h1>Salut ${esc(ctx.moi.pseudo)} !</h1><p>${esc(resume)}</p><span class="coeurs">${COEUR}</span></div>
      <nav class="raccourcis" aria-label="Rubriques">
        <a class="raccourci" href="#/sorties" style="--c:var(--orange)">${ICO.sorties}<b>Sorties</b><span>${s.sorties.length} à venir · tu vas à ${mesSorties}</span></a>
        <a class="raccourci" href="#/cartes" style="--c:var(--jaune);--c-t:var(--encre)">${ICO.cartes}<b>Cartes</b><span>${c.mienne.size} / ${c.cartes.length} · ${c.booster ? 'booster ouvert' : 'booster à ouvrir !'}</span></a>
        <a class="raccourci" href="#/jeux" style="--c:var(--vert)">${ICO.jeux}<b>Jeux</b><span>${joues ? `${joues} sur 2 joués aujourd’hui` : 'Pas encore joué aujourd’hui'}</span></a>
        <a class="raccourci" href="#/gang" style="--c:var(--bleu)">${ICO.gang}<b>Le gang</b><span>${s.profils.size} membre${s.profils.size > 1 ? 's' : ''}</span></a>
      </nav></section>
    <div class="grille grille-2">
      <section class="bloc" aria-labelledby="pro-h"><div class="bloc-titre"><h2 id="pro-h">Prochaine sortie</h2><a href="#/sorties">Toutes</a></div>
        <div id="prochaine" style="padding:8px 6px 4px">${prochaine ? polaroidHtml(prochaine, s.profils, ctx.moi) : `<p class="vide">Rien de prévu.<br><a class="btn btn-petit" style="margin-top:12px" href="#/sorties/nouvelle">${ICO.plus}Proposer une sortie</a></p>`}</div></section>
      <section class="bloc" aria-labelledby="fil-h"><div class="bloc-titre"><h2 id="fil-h">Le fil du gang</h2></div>
        ${evenements.length ? `<ul class="fil">${evenements.map((x) => `<li>${x.html}</li>`).join('')}</ul>` : '<p class="vide">Rien encore : ouvre ton premier booster ou propose une sortie !</p>'}</section>
    </div>`;
  if (prochaine) brancherChoix($('#prochaine'), ctx, s);
}
