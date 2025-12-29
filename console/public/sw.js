// Service Worker for Morgus PWA
// Version is updated automatically during build - DO NOT cache aggressively

const CACHE_VERSION = "v2-" + Date.now(); // Dynamic version to bust cache
const CACHE_NAME = `morgus-cache-${CACHE_VERSION}`;

// Only cache truly static assets (icons, fonts)
const STATIC_ASSETS = [
  "/icons/morgus-192.png",
  "/icons/morgus-512.png",
  "/manifest.webmanifest"
];

// Install event - cache only essential static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new service worker version:", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately - don't wait for old SW to finish
  self.skipWaiting();
});

// Activate event - AGGRESSIVELY clean up ALL old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // Remove ALL old caches
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log("[SW] Old caches cleared, taking control");
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK FIRST for everything except static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== "GET") return;
  
  // Skip cross-origin requests entirely
  if (url.origin !== self.location.origin) return;
  
  // Skip API requests - NEVER cache these
  if (url.pathname.includes("/api/") || 
      url.hostname.includes("supabase") ||
      url.pathname.includes("auth")) {
    return;
  }
  
  // For HTML/navigation requests - ALWAYS go to network first
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          console.log("[SW] Serving fresh HTML from network");
          return response;
        })
        .catch(() => {
          console.log("[SW] Network failed for navigation, serving cached index");
          return caches.match("/") || new Response("Offline", { status: 503 });
        })
    );
    return;
  }
  
  // For JS/CSS bundles - ALWAYS go to network (they have hash in filename)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new version
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache as fallback when offline
          return caches.match(request);
        })
    );
    return;
  }
  
  // For static assets (images, fonts) - cache first, then network
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached, but also update in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          return cached;
        }
        // Not cached, fetch and cache
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    console.log("[SW] Received skipWaiting message");
    self.skipWaiting();
  }
  if (event.data === "clearCache") {
    console.log("[SW] Clearing all caches");
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

console.log("[SW] Service Worker loaded - Morgus PWA", CACHE_VERSION);
