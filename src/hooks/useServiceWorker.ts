import { useEffect, useState } from 'react';

interface SWState {
  updateAvailable: boolean;
  waitingServiceWorker: ServiceWorker | null;
}

// Registers the service worker and exposes a small API for prompting updates.
export function useServiceWorker() {
  const [state, setState] = useState<SWState>({ updateAvailable: false, waitingServiceWorker: null });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
            if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState({ updateAvailable: true, waitingServiceWorker: newWorker });
            }
          });
        });

        // In case an update was already waiting
        if (registration.waiting) {
          setState({ updateAvailable: true, waitingServiceWorker: registration.waiting });
        }
      } catch (e) {
        console.warn('Service worker registration failed', e);
      }
    };
    registerSW();
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel('sw-messages');
    channel.onmessage = (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        setState(s => ({ ...s, updateAvailable: true }));
      }
    };
    return () => channel.close();
  }, []);

  // Expose a small API (could be extended to UI toast)
  (window as any).__secureGateSW = {
    applyUpdate: () => {
      if (state.waitingServiceWorker) {
        state.waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    updateAvailable: () => state.updateAvailable
  };
}
