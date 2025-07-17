import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from './lib/logger'

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        logger.info('SW registered: ', registration);
      })
      .catch(registrationError => {
        logger.error('SW registration failed: ', registrationError);
      });
  });
}
