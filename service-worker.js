"use strict";

// Caché solo de recursos estáticos de una lista cerrada. Nunca se guarda nada más.
const CACHE_PREFIX = "ficha-privada-";
const CACHE_NAME = CACHE_PREFIX + "estatico-v2";

const STATIC_FILES = [
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

const toHref = (path) => new URL(path, self.registration.scope).href;
const ALLOWED = new Set(STATIC_FILES.map(toHref));
const INDEX_HREF = toHref("./index.html");
const ROOT_HREF = toHref("./");

function staticRequest(href) {
  // cache:"reload" evita copiar versiones antiguas de la caché HTTP; redirect:"error" rechaza redirecciones.
  return new Request(href, { cache: "reload", redirect: "error", credentials: "omit" });
}

function isValidStatic(response) {
  return response.ok && response.type === "basic" && !response.redirected;
}

self.addEventListener("install", (event) => {
  // Sin activación forzada: la versión nueva se activa cuando se cierran las ventanas de la versión anterior.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all([...ALLOWED].map(async (href) => {
      const response = await fetch(staticRequest(href));
      if (!isValidStatic(response)) throw new Error("Recurso estático no válido");
      await cache.put(href, response);
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function cacheFirst(href) {
  const cached = await caches.match(href, { cacheName: CACHE_NAME });
  if (cached) return cached;
  try {
    const response = await fetch(staticRequest(href));
    if (!isValidStatic(response)) throw new Error("Recurso estático no válido");
    const cache = await caches.open(CACHE_NAME);
    await cache.put(href, response.clone());
    return response;
  } catch (_) {
    return new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Nada de otros orígenes ni de métodos distintos de GET.
  if (url.origin !== self.location.origin || request.method !== "GET") {
    event.respondWith(Response.error());
    return;
  }

  // La query y el fragmento se ignoran: nunca se usan para guardar ni buscar datos.
  const clean = url.origin + url.pathname;
  let target = null;
  if (request.mode === "navigate") {
    if (clean === ROOT_HREF || clean === INDEX_HREF) target = INDEX_HREF;
  } else if (ALLOWED.has(clean)) {
    target = clean;
  }

  if (!target) {
    event.respondWith(new Response("No encontrado", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
    return;
  }
  event.respondWith(cacheFirst(target));
});
