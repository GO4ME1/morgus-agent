import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return; // Already installed as PWA
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // For iOS, show custom instructions
    if (isIOSDevice) {
      // Only show on Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        setTimeout(() => setShowInstall(true), 3000); // Show after 3 seconds
      }
      return;
    }

    // For other browsers, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowInstall(true), 2000); // Show after 2 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setShowInstall(false);
      } else {
        console.log('[PWA] User dismissed install prompt');
        handleDismiss();
      }
    } catch {
      console.error('[PWA] Install error:', error);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showInstall) return null;

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-install-content">
          <img src="/icons/morgus-192.png" alt="Morgus" className="pwa-install-icon" />
          <div className="pwa-install-text">
            <strong>Install Morgus</strong>
            <span>Add to home screen for the best experience</span>
          </div>
        </div>
        <div className="pwa-install-actions">
          <button className="pwa-install-btn" onClick={handleInstall}>
            Install
          </button>
          <button className="pwa-dismiss-btn" onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>

      {showIOSInstructions && (
        <div className="pwa-ios-modal-overlay" onClick={handleDismiss}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pwa-ios-close" onClick={handleDismiss}>✕</button>
            <img src="/icons/morgus-192.png" alt="Morgus" className="pwa-ios-icon" />
            <h3>Install Morgus on iOS</h3>
            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <span className="step-number">1</span>
                <span>Tap the <strong>Share</strong> button <span className="ios-share-icon">⬆️</span></span>
              </div>
              <div className="pwa-ios-step">
                <span className="step-number">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="pwa-ios-step">
                <span className="step-number">3</span>
                <span>Tap <strong>"Add"</strong> in the top right</span>
              </div>
            </div>
            <button className="pwa-ios-done" onClick={handleDismiss}>Got it!</button>
          </div>
        </div>
      )}
    </>
  );
}
