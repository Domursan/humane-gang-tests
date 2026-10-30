// Rubrique « Le gang » : les membres (cartes trouvées, sorties où ils vont), et mon profil (pseudo, couleur, déconnexion).
import { esc, $, ava, toast, msgErreur, COULEURS } from '../ui.js';

export async function afficher(main, ctx) {
  const [p, col, rep] = await Promise.all([
    ctx.sb.from('tg_profils').select('*').order('pseudo'),
    ctx.sb.from('tg_collection').select('user_id'),
    ctx.sb.from('tg_reponses').select('user_id').eq('reponse', 'oui'),
  ]);
  for (const r of [p, col, rep]) if (r.error) throw r.error;
  const compte = (rows) => rows.reduce((m, r) => m.set(r.user_id, (m.get(r.user_id) || 0) + 1), new Map());
  const cartes = compte(col.data), sorties = compte(rep.data);
  main.innerHTML = `<header class="entete"><div><span class="etiquette">Le gang</span><h1>Tout le monde</h1>
      <p>${p.data.length} membre${p.data.length > 1 ? 's' : ''} ont déjà poussé la porte de ce carnet.</p></div></header>
    <ul class="membres">${p.data.map((m) => `<li class="membre">${ava(m, 52)}<div><b>${esc(m.pseudo)}${m.id === ctx.moi.id ? ' (toi)' : ''}</b>
      <span>${cartes.get(m.id) || 0} carte${(cartes.get(m.id) || 0) > 1 ? 's' : ''} · ${sorties.get(m.id) || 0} sortie${(sorties.get(m.id) || 0) > 1 ? 's' : ''}</span></div></li>`).join('')}</ul>
    <section class="bloc" style="margin-top:30px;max-width:560px" aria-labelledby="moi-h"><h2 id="moi-h">Mon profil</h2>
      <form class="form" id="f-moi" style="margin-top:16px">
        <label class="champ">Pseudo<input name="pseudo" value="${esc(ctx.moi.pseudo)}" minlength="2" maxlength="24" required></label>
        <fieldset style="border:0;padding:0;margin:0" class="champ"><legend style="margin-bottom:8px">Ma couleur</legend>
          <div class="couleurs">${COULEURS.map((c, i) => `<label><input type="radio" name="couleur" value="${c}"${c.toLowerCase() === ctx.moi.couleur.toLowerCase() ? ' checked' : ''}><i style="--a:${c}"></i><span class="masque">Couleur ${i + 1}</span></label>`).join('')}</div></fieldset>
        <p class="erreur" id="f-err" role="alert" hidden></p>
        <p style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-rub" type="submit">Enregistrer</button>
          <button class="btn btn-doux" type="button" id="sortir">Me déconnecter</button></p>
      </form></section>`;
  $('#f-moi').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = $('#f-err');
    const { error } = await ctx.sb.from('tg_profils').update({ pseudo: String(f.get('pseudo')).trim(), couleur: f.get('couleur') }).eq('id', ctx.moi.id);
    if (error) { err.textContent = error.code === '23505' ? 'Ce pseudo est déjà pris.' : msgErreur(error); err.hidden = false; return; }
    await ctx.rafraichirProfil();
    toast('Profil enregistré.');
    afficher(main, ctx);
  });
  $('#sortir').addEventListener('click', () => ctx.deconnexion());
}
