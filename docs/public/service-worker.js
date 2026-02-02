// service-worker.js (cleanup SW)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // 1) Delete *all* caches (old VuePress/VitePress precache etc.)
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // 2) Unregister this service worker
    await self.registration.unregister();

    // 3) Reload all open tabs so they fetch fresh content normally
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});
