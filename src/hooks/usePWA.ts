import { useState, useEffect } from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAHookReturn {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  installPrompt: PWAInstallPrompt | null;
  install: () => Promise<void>;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  updateAvailable: boolean;
  refresh: () => void;
}

export function usePWA(): PWAHookReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Detect if app is running in standalone mode
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Detect Android
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Listen for network status changes
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Service worker update handling
    const handleServiceWorkerUpdate = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        setUpdateAvailable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerUpdate);
    };
  }, [isStandalone]);

  const install = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  const refresh = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  return {
    isInstalled,
    isInstallable,
    isOffline,
    installPrompt,
    install,
    isStandalone,
    isIOS,
    isAndroid,
    updateAvailable,
    refresh,
  };
}

// Helper function to register service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  window.postMessage({ type: 'SW_UPDATE_AVAILABLE' }, '*');
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Background sync helper
export function queueOfflineAction(actionType: string, data: any) {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
    // Store data in IndexedDB for background sync
    const request = indexedDB.open('SecureGateOfflineDB', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pending-actions')) {
        const store = db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-actions'], 'readwrite');
      const store = transaction.objectStore('pending-actions');
      
      store.add({
        type: actionType,
        data: data,
        timestamp: Date.now()
      });
      
      // Register background sync
      navigator.serviceWorker.ready.then((registration) => {
        return (registration as any).sync.register(actionType);
      });
    };
  }
}

// Push notification helper
export async function subscribeToPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });
        
        // Send subscription to server
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        return subscription;
      }
    } catch (error) {
      console.error('Push notification subscription failed:', error);
    }
  }
  return null;
}

// Performance monitoring for mobile
export function trackMobilePerformance() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
        
        // Track mobile-specific metrics
        const metrics = {
          loadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
          connectionType: (navigator as any).connection?.effectiveType,
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
        
        // Send to analytics (when available)
        console.log('Mobile Performance Metrics:', metrics);
        
        // Optional: Send to monitoring service
        if (loadTime > 3000) {
          console.warn('Slow mobile load time detected:', loadTime);
        }
      }, 1000);
    });
  }
}
