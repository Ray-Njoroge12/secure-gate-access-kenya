// CSS optimization utilities for better performance

// Critical CSS content inlined for immediate injection
const criticalCSS = `
/* Critical CSS - Above the fold styles for immediate rendering */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

*, ::before, ::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: hsl(var(--border));
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}

body {
  margin: 0;
  line-height: inherit;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

.route-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex-direction: column;
  gap: 1rem;
}

.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 0.5rem 1rem;
}

.card {
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-4 { gap: 1rem; }
.min-h-screen { min-height: 100vh; }
.w-full { width: 100%; }
.h-4 { height: 1rem; }
`;

/**
 * Inject critical CSS immediately for faster initial render
 */
export const injectCriticalCSS = () => {
  if (typeof document === 'undefined') return;

  // Check if critical CSS is already injected
  if (document.getElementById('critical-css')) return;

  // Create and inject critical CSS
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = criticalCSS;
  
  // Insert before any existing stylesheets
  const firstLink = document.head.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
  
  // Add CSS loading class to body
  document.body.classList.add('css-loading');
};

/**
 * Preload CSS files for faster subsequent loads
 */
export const preloadCSS = (href: string, crossorigin = false) => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  if (crossorigin) link.crossOrigin = 'anonymous';
  
  // Convert to actual stylesheet after load
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  
  document.head.appendChild(link);
};

/**
 * Lazy load non-critical CSS
 */
export const loadNonCriticalCSS = () => {
  if (typeof document === 'undefined') return;

  // Remove CSS loading class once main styles are ready
  const removeLoadingClass = () => {
    document.body.classList.remove('css-loading');
  };

  // Load main stylesheet if not already loaded
  const mainCSS = document.querySelector('link[href*="index"]') as HTMLLinkElement;
  if (mainCSS) {
    if ((mainCSS as any).sheet) {
      removeLoadingClass();
    } else {
      mainCSS.addEventListener('load', removeLoadingClass);
    }
  } else {
    // Fallback: remove loading class after a short delay
    setTimeout(removeLoadingClass, 100);
  }
};

/**
 * Optimize fonts loading
 */
export const optimizeFonts = () => {
  if (typeof document === 'undefined') return;

  // Preload system fonts to avoid layout shift
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preconnect';
  fontPreload.href = 'https://fonts.googleapis.com';
  document.head.appendChild(fontPreload);

  // Use font-display: swap for custom fonts
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Inter Regular'), local('Inter-Regular');
    }
  `;
  document.head.appendChild(style);
};

/**
 * Remove unused CSS classes (basic implementation)
 */
export const purgeUnusedCSS = () => {
  if (typeof document === 'undefined' || process.env.NODE_ENV !== 'production') return;

  // This is a basic implementation - in production, you'd use tools like PurgeCSS
  const unusedSelectors = [
    '.hidden-mobile',
    '.debug-only',
    '.development-only',
    '.unused-component'
  ];

  // Remove unused utility classes
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(stylesheet => {
    try {
      const rules = Array.from(stylesheet.cssRules || []);
      rules.forEach((rule, index) => {
        if (rule.type === CSSRule.STYLE_RULE) {
          const styleRule = rule as CSSStyleRule;
          unusedSelectors.forEach(selector => {
            if (styleRule.selectorText?.includes(selector)) {
              stylesheet.deleteRule(index);
            }
          });
        }
      });
    } catch (e) {
      // Cross-origin stylesheets can't be accessed
      console.debug('Cannot access stylesheet rules:', e);
    }
  });
};

/**
 * Optimize CSS animations for better performance
 */
export const optimizeAnimations = () => {
  if (typeof document === 'undefined') return;

  // Reduce animations on low-end devices
  const isLowEndDevice = () => {
    const connection = (navigator as any).connection;
    return (
      navigator.hardwareConcurrency < 4 ||
      (navigator as any).deviceMemory < 4 ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g'
    );
  };

  if (isLowEndDevice()) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * CSS containment for better performance
 */
export const applyCSSContainment = () => {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = `
    /* Apply CSS containment to isolated components */
    .card, .modal, .dropdown-menu {
      contain: layout style paint;
    }
    
    /* Strict containment for heavy components */
    .chart-container, .data-table, .calendar-widget {
      contain: strict;
    }
    
    /* Size containment for fixed-size components */
    .avatar, .icon, .badge {
      contain: size;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Initialize all CSS optimizations
 */
export const initCSSOptimizations = () => {
  // Inject critical CSS immediately
  injectCriticalCSS();
  
  // Optimize fonts
  optimizeFonts();
  
  // Apply CSS containment
  applyCSSContainment();
  
  // Load non-critical CSS when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNonCriticalCSS);
  } else {
    loadNonCriticalCSS();
  }
  
  // Optimize animations for low-end devices
  optimizeAnimations();
  
  // Purge unused CSS in production
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(purgeUnusedCSS, 1000);
    });
  }
};

/**
 * Utility to measure CSS performance
 */
export const measureCSSPerformance = () => {
  if (typeof performance === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintEntries = performance.getEntriesByType('paint');
  
  const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint');
  
  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    firstContentfulPaint: fcp?.startTime || 0,
    largestContentfulPaint: lcp?.startTime || 0,
    totalCSSFiles: document.querySelectorAll('link[rel="stylesheet"]').length,
    inlineStyles: document.querySelectorAll('style').length,
  };
};
