// CSS optimization and critical CSS extraction utility
export const extractCriticalCSS = () => {
  // Extract above-the-fold styles
  const criticalCSS = `
    /* Critical above-the-fold styles */
    body, html {
      margin: 0;
      padding: 0;
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;
      color-scheme: light dark;
      color: rgba(255, 255, 255, 0.87);
      background-color: #242424;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Loading spinner for lazy routes */
    .route-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      flex-direction: column;
      gap: 1rem;
    }

    /* Header and navigation critical styles */
    .header-critical {
      position: relative;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    /* Button critical styles */
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    /* Card component critical styles */
    .card-critical {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
    }

    /* Loading skeleton critical styles */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Spinner animation */
    .spinner {
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return criticalCSS;
};

// Function to inject critical CSS
export const injectCriticalCSS = () => {
  if (typeof document !== 'undefined') {
    const criticalStyles = document.createElement('style');
    criticalStyles.id = 'critical-css';
    criticalStyles.innerHTML = extractCriticalCSS();
    document.head.insertBefore(criticalStyles, document.head.firstChild);
  }
};

// Function to preload critical route chunks
export const preloadCriticalChunks = () => {
  const criticalChunks = [
    '/assets/vendor-B7l56H3n.js',
    '/assets/supabase-CRmpT3cH.js',
    '/assets/query-DFF9H-Uf.js'
  ];

  criticalChunks.forEach(chunk => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = chunk;
      document.head.appendChild(link);
    }
  });
};

// Resource hints for better performance
export const addResourceHints = () => {
  if (typeof document !== 'undefined') {
    // DNS prefetch for external resources
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://fwacwevimpifqvwpxquq.supabase.co';
    document.head.appendChild(dnsPrefetch);

    // Preconnect to Supabase
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fwacwevimpifqvwpxquq.supabase.co';
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  }
};

// Initialize all performance optimizations
export const initPerformanceOptimizations = () => {
  // Inject critical CSS immediately
  injectCriticalCSS();
  
  // Add resource hints
  addResourceHints();
  
  // Preload critical chunks after main bundle loads
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      preloadCriticalChunks();
    });
  }
};
