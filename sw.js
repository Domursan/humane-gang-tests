// Service worker de nettoyage : l'ancienne copie du site enregistrait /humane-gang-tests/sw.js et gardait ses pages en
// cache. Ce fichier le remplace : il vide les caches, se désinstalle et recharge les onglets ouverts sur le nouveau site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
  })());
});
