import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());
  const mountStartTime = useRef<number>(performance.now());

  useEffect(() => {
    const mountTime = performance.now() - mountStartTime.current;
    
    // Log performance metrics
    console.debug(`🔍 Performance [${componentName}]:`, {
      mountTime: `${mountTime.toFixed(2)}ms`,
      renderTime: `${(performance.now() - renderStartTime.current).toFixed(2)}ms`
    });

    // Optional: Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_timing', {
        custom_parameter: componentName,
        value: Math.round(mountTime)
      });
    }
  }, [componentName]);

  const trackRender = () => {
    renderStartTime.current = performance.now();
  };

  return { trackRender };
};