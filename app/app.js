// Humane Gang (site de test) : démarrage, connexion, profil, en-tête et navigation par ancre (#/sorties, #/cartes/…).
// Chaque rubrique est un module de app/vues/ chargé à la demande, qui exporte afficher(main, ctx, params).
import { sb, esc, $, ava, toast, msgErreur, ICO, RUBRIQUES, COULEURS } from './ui.js';

const ctx = { sb, moi: null, session: null };
const VUES = { '': 'accueil', sorties: 'sorties', cartes: 'cartes', jeux: 'jeux', gang: 'gang' };
const main = $('#contenu');

// L'ancienne copie du site avait un service worker qui garde ses pages : on le remplace (sw.js le désinstalle).
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.update().catch(() => {}))).catch(() => {});

/** En-tête (ordinateur) et barre d'onglets (téléphone) ; rubrique en cours marquée. */
function dessinerEntete(rub) {
  const logo = `<a class="marque" href="#/"><img src="./img/logo-192.webp" width="52" height="52" alt=""><span><b>Humane Gang</b><small>le carnet du gang</small></span></a>`;
  if (!ctx.moi) { $('#haut').innerHTML = logo; $('#onglets').hidden = true; return; }
  const lien = (r, cls = '') => `<a${cls} href="${r.href}" style="--c:${r.c};${r.t ? `--c-t:${r.t}` : ''}"${r.id === rub ? ' aria-current="page"' : ''}>${ICO[r.id]}<span>${r.nom}</span></a>`;
  $('#haut').innerHTML = `${logo}<nav class="nav" aria-label="Navigation principale">${RUBRIQUES.map((r) => lien(r)).join('')}</nav>
    <a class="moi" href="#/gang" aria-label="Mon profil : ${esc(ctx.moi.pseudo)}">${ava(ctx.moi, 38)}<span class="moi-nom">${esc(ctx.moi.pseudo)}</span></a>`;
  $('#onglets').innerHTML = RUBRIQUES.map((r) => lien(r)).join('');
  $('#onglets').hidden = false;
}

/** Affiche la rubrique de l'adresse (#/rubrique/param). */
async function router() {
  const [rub = '', ...params] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!ctx.session) return connexion();
  if (!ctx.moi) return creerProfil();
  const vue = VUES[rub] ?? 'accueil';
  document.body.dataset.rub = rub && VUES[rub] ? rub : 'qg';
  dessinerEntete(rub && VUES[rub] ? rub : 'qg');
  main.innerHTML = '<p class="chargement">Chargement…</p>';
  try {
    const m = await import(`./vues/${vue}.js`);
    await m.afficher(main, ctx, params.map(decodeURIComponent));
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="bloc"><h2>Oups</h2><p class="discret" style="margin-top:8px">${esc(msgErreur(e))}</p></div>`;
  }
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

/** Porte d'entrée : connexion avec le compte du site (mêmes identifiants que humane-gang.com). */
function connexion() {
  document.body.dataset.rub = 'qg';
  dessinerEntete(null);
  main.innerHTML = `<section class="porte">
      <img src="./img/logo-512.webp" width="120" height="120" alt="">
      <h1>Salut le gang</h1>
      <p class="discret" style="margin-top:10px">Le carnet du gang : nos sorties, nos cartes, nos jeux. Connecte-toi avec ton compte Humane Gang.</p>
      <form class="bloc form" id="f-connexion">
        <label class="champ">Adresse e-mail<input type="email" name="email" autocomplete="email" required></label>
        <label class="champ">Mot de passe<input type="password" name="mdp" autocomplete="current-password" required></label>
        <p class="erreur" id="f-err" role="alert" hidden></p>
        <button class="btn" type="submit">Entrer au QG</button>
      </form>
      <p class="discret petit" style="margin-top:14px">Site de test : il a ses propres données, rien n’y touche le vrai site.</p>
    </section>`;
  $('#f-connexion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = $('#f-err'), b = e.target.querySelector('button');
    b.disabled = true; err.hidden = true;
    const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('mdp') });
    b.disabled = false;
    if (error) { err.textContent = error.message === 'Invalid login credentials' ? 'Adresse ou mot de passe incorrect.' : error.message; err.hidden = false; }
  });
}

/** Premier passage : pseudo et couleur du profil de test (tg_profils). */
function creerProfil() {
  document.body.dataset.rub = 'qg';
  dessinerEntete(null);
  const propose = (ctx.session.user.email || '').split('@')[0].slice(0, 24);
  main.innerHTML = `<section class="porte">
      <img src="./img/logo-512.webp" width="120" height="120" alt="">
      <h1>Bienvenue !</h1>
      <p class="discret" style="margin-top:10px">Choisis comment le gang te verra sur ce carnet.</p>
      <form class="bloc form" id="f-profil">
        <label class="champ">Pseudo<input name="pseudo" value="${esc(propose)}" minlength="2" maxlength="24" required></label>
        <fieldset style="border:0;padding:0;margin:0" class="champ"><legend style="margin-bottom:8px">Ta couleur</legend>
          <div class="couleurs">${COULEURS.map((c, i) => `<label><input type="radio" name="couleur" value="${c}"${i === 0 ? ' checked' : ''}><i style="--a:${c}"></i><span class="masque">Couleur ${i + 1}</span></label>`).join('')}</div>
        </fieldset>
        <p class="erreur" id="f-err" role="alert" hidden></p>
        <button class="btn" type="submit">C’est parti</button>
      </form>
    </section>`;
  $('#f-profil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = $('#f-err');
    const { data, error } = await sb.from('tg_profils').insert({ id: ctx.session.user.id, pseudo: String(f.get('pseudo')).trim(), couleur: f.get('couleur') }).select().single();
    if (error) { err.textContent = error.code === '23505' ? 'Ce pseudo est déjà pris.' : error.message; err.hidden = false; return; }
    ctx.moi = data;
    toast(`Bienvenue au QG, ${data.pseudo} !`);
    router();
  });
}

/** Recharge mon profil (après une modification dans « Le gang »). */
ctx.rafraichirProfil = async () => {
  const { data } = await sb.from('tg_profils').select('*').eq('id', ctx.session.user.id).maybeSingle();
  ctx.moi = data;
  dessinerEntete(document.body.dataset.rub);
};
ctx.deconnexion = async () => { await sb.auth.signOut(); location.hash = '#/'; };

async function demarrer() {
  const { data: { session } } = await sb.auth.getSession();
  ctx.session = session;
  if (session) await ctx.rafraichirProfil();
  sb.auth.onAuthStateChange(async (ev, s) => {
    // Rafraîchissement du jeton, ou même compte déjà connu (rechargement de la page) : rien à redessiner
    if (ev === 'TOKEN_REFRESHED' || ev === 'INITIAL_SESSION' || (s && s.user.id === ctx.session?.user.id && ctx.moi)) { ctx.session = s; return; }
    ctx.session = s; ctx.moi = null;
    if (s) await ctx.rafraichirProfil();
    router();
  });
  window.addEventListener('hashchange', router);
  router();
}
demarrer().catch((e) => { main.innerHTML = `<p class="chargement">Le QG ne répond pas : ${esc(msgErreur(e))}</p>`; });
