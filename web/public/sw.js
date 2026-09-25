// Quota — service worker essenziale.
// Obiettivo unico: mostrare una pagina offline sensata quando la rete non
// c'e'. Nessuna cache di dati finanziari (sono privati e cambiano spesso):
// solo l'app shell statica necessaria a rendere /offline.

const CACHE_NAME = "quota-shell-v1";
const OFFLINE_URL = "/offline";
const SHELL_ASSETS = [OFFLINE_URL, "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Solo le navigazioni HTML passano dalla cache offline; tutto il resto
// (API Supabase, RSC payload, assets) va sempre in rete: i dati sono
// privati e non devono mai essere serviti da cache stale.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((res) => res ?? Response.error())
    )
  );
});
