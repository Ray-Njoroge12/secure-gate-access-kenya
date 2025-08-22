import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  bundleLoadTime: number | null;
  initialRenderTime: number | null;
}

interface WebVitalsReports {
  [key: string]: number;
}

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    bundleLoadTime: null,
    initialRenderTime: null,
  });

  const [webVitals, setWebVitals] = useState<WebVitalsReports>({});

  useEffect(() => {
    const startTime = performance.now();

    // Measure Time to First Byte (TTFB)
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }
    };

    // Measure bundle load time
    const measureBundleLoadTime = () => {
      const endTime = performance.now();
      const bundleLoadTime = endTime - startTime;
      setMetrics(prev => ({ ...prev, bundleLoadTime, initialRenderTime: bundleLoadTime }));
    };

    // Web Vitals observer
    const observeWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              const fcp = entry.startTime;
              setMetrics(prev => ({ ...prev, fcp }));
              setWebVitals(prev => ({ ...prev, FCP: fcp }));
            }
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          setMetrics(prev => ({ ...prev, lcp }));
          setWebVitals(prev => ({ ...prev, LCP: lcp }));
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const eventEntry = entry as any; // First Input Delay entry type
            const fid = eventEntry.processingStart - eventEntry.startTime;
            setMetrics(prev => ({ ...prev, fid }));
            setWebVitals(prev => ({ ...prev, FID: fid }));
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            const layoutEntry = entry as any; // Layout Shift entry type
            if (!layoutEntry.hadRecentInput) {
              cls += layoutEntry.value;
            }
          }
          setMetrics(prev => ({ ...prev, cls }));
          setWebVitals(prev => ({ ...prev, CLS: cls }));
        }).observe({ entryTypes: ['layout-shift'] });
      }
    };

    // Initialize measurements
    measureTTFB();
    observeWebVitals();
    
    // Measure bundle load time after component mount
    const timeoutId = setTimeout(measureBundleLoadTime, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Performance grade calculation
  const getPerformanceGrade = () => {
    const { fcp, lcp, fid, cls, ttfb } = metrics;
    
    let score = 100;
    
    // FCP scoring (target: <1.8s)
    if (fcp) {
      if (fcp > 3000) score -= 20;
      else if (fcp > 1800) score -= 10;
    }
    
    // LCP scoring (target: <2.5s)
    if (lcp) {
      if (lcp > 4000) score -= 25;
      else if (lcp > 2500) score -= 15;
    }
    
    // FID scoring (target: <100ms)
    if (fid) {
      if (fid > 300) score -= 20;
      else if (fid > 100) score -= 10;
    }
    
    // CLS scoring (target: <0.1)
    if (cls) {
      if (cls > 0.25) score -= 20;
      else if (cls > 0.1) score -= 10;
    }
    
    // TTFB scoring (target: <600ms)
    if (ttfb) {
      if (ttfb > 1000) score -= 15;
      else if (ttfb > 600) score -= 5;
    }
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  };

  // Report performance metrics to console in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && Object.values(metrics).some(v => v !== null)) {
      console.group('🚀 Performance Metrics');
      console.log('First Contentful Paint (FCP):', metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'N/A');
      console.log('Largest Contentful Paint (LCP):', metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'N/A');
      console.log('First Input Delay (FID):', metrics.fid ? `${metrics.fid.toFixed(2)}ms` : 'N/A');
      console.log('Cumulative Layout Shift (CLS):', metrics.cls ? metrics.cls.toFixed(4) : 'N/A');
      console.log('Time to First Byte (TTFB):', metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : 'N/A');
      console.log('Bundle Load Time:', metrics.bundleLoadTime ? `${metrics.bundleLoadTime.toFixed(2)}ms` : 'N/A');
      console.log('Performance Grade:', getPerformanceGrade());
      console.groupEnd();
    }
  }, [metrics]);

  return {
    metrics,
    webVitals,
    performanceGrade: getPerformanceGrade(),
    isLoading: Object.values(metrics).every(v => v === null)
  };
};
