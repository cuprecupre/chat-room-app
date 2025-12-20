// Service Worker para cacheo de assets
const CACHE_NAME = "impostor-v1";
// No caches index.html to avoid serving stale app shell during auth redirects
const ASSETS_TO_CACHE = [
    "/src/assets/card.png",
    "/src/assets/card-back.png",
    "/src/assets/dual-impostor.png",
    "/src/assets/bell.png",
    "/src/assets/llave.png",
    "/favicon.png",
    "/og.png",
];

// Instalar Service Worker
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("Caching assets...");
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.log("Cache failed:", error);
            })
    );
});

// Activar Service Worker
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar requests
self.addEventListener("fetch", (event) => {
    // Nunca interceptar navegación de documentos (para no romper auth redirects)
    if (event.request.mode === "navigate") {
        return; // Dejar que el navegador maneje la navegación
    }

    // Solo cachear requests de assets estáticos
    if (
        event.request.destination === "image" ||
        event.request.url.includes("/assets/") ||
        event.request.url.includes("/src/assets/")
    ) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                // Si está en cache, devolverlo
                if (response) {
                    return response;
                }

                // Si no está en cache, hacer fetch y cachear
                return fetch(event.request)
                    .then((response) => {
                        // Verificar que la respuesta sea válida
                        if (!response || response.status !== 200 || response.type !== "basic") {
                            return response;
                        }

                        // Clonar la respuesta para cachearla
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        // Si falla el fetch, devolver una imagen placeholder o el request original
                        return fetch(event.request);
                    });
            })
        );
    }
});
