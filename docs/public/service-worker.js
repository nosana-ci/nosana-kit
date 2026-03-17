// service-worker.js (cleanup SW)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // 1) Delete *all* caches (old VuePress/VitePress precache etc.)
    const keys = await caches.keys();
    await Promise.allSettled(keys.map((k) => caches.delete(k)));

    // 2) Unregister this service worker
    try {
      await self.registration.unregister();
    } catch {
      // Best-effort; keep going to refresh clients
    }

    // 3) Reload all open tabs so they fetch fresh content normally
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
  })());
});
