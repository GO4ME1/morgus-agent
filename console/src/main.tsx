import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AppRoutes } from './AppRoutes'
import './App.css'

// Register Service Worker for PWA with aggressive update strategy
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[PWA] Service Worker registered:", registration.scope);
      
      // Check for updates immediately
      registration.update();
      
      // Check for updates every 5 minutes
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);
      
      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available - force update
                console.log("[PWA] New content available, updating...");
                newWorker.postMessage("skipWaiting");
                // Reload the page to get the new version
                window.location.reload();
              } else {
                // First install
                console.log("[PWA] Content cached for offline use");
              }
            }
          });
        }
      });
      
      // Handle controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] New service worker activated");
      });
      
    } catch (err) {
      console.error("[PWA] Service Worker registration failed:", err);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
