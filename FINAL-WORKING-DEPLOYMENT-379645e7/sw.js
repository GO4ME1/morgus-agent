const CACHE_NAME = "morgus-shell-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/morgus-192.png",
  "/icons/morgus-512.png"
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching core assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== "GET") return;
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;
  
  // Skip API requests - always go to network
  if (request.url.includes("/api/") || request.url.includes("supabase")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();
        
        // Cache successful responses for static assets
        if (response.ok && (
          request.url.endsWith('.js') ||
          request.url.endsWith('.css') ||
          request.url.endsWith('.png') ||
          request.url.endsWith('.jpg') ||
          request.url.endsWith('.svg') ||
          request.url.endsWith('.woff2')
        )) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            console.log("[SW] Serving from cache:", request.url);
            return cached;
          }
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

console.log("[SW] Service Worker loaded - Morgus PWA v1");
