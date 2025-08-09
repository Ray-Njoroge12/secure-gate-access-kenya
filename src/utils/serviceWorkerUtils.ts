// Utility functions for service worker management

export const clearServiceWorkerCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All service worker caches cleared');
  }
};

export const unregisterServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    console.log('All service workers unregistered');
  }
};

export const clearAllServiceWorkerData = async () => {
  await clearServiceWorkerCaches();
  await unregisterServiceWorkers();
  console.log('All service worker data cleared');
};

export const checkServiceWorkerStatus = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const controller = navigator.serviceWorker.controller;
    
    return {
      registrations: registrations.length,
      controller: !!controller,
      ready: await navigator.serviceWorker.ready,
    };
  }
  return null;
};

// Prevent update loops by storing last update time
export const shouldCheckForUpdates = (): boolean => {
  const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > oneHour) {
    localStorage.setItem('lastUpdateCheck', now.toString());
    return true;
  }
  
  return false;
};

// Store update acceptance to prevent repeated prompts
export const markUpdateAccepted = () => {
  localStorage.setItem('updateAccepted', Date.now().toString());
};

export const hasRecentlyAcceptedUpdate = (): boolean => {
  const lastAccepted = localStorage.getItem('updateAccepted');
  if (!lastAccepted) return false;
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  
  return (now - parseInt(lastAccepted)) < oneDay;
};

