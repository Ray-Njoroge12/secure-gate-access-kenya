export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
}

export interface WebVitals {
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay  
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTFB: number; // Time to First Byte
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private webVitals: Partial<WebVitals> = {};
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initWebVitalsMonitoring();
  }

  private initWebVitalsMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.webVitals.LCP = entry.startTime;
          }
          if (entry.entryType === 'first-input') {
            this.webVitals.FID = (entry as any).processingStart - entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.webVitals.CLS = (this.webVitals.CLS || 0) + (entry as any).value;
          }
        }
      });

      try {
        this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        console.warn('Performance Observer not supported for some metrics');
      }
    }

    // Monitor Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.webVitals.TTFB = navigation.responseStart - navigation.requestStart;
          this.webVitals.FCP = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
        }
      }, 0);
    });
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push({
      ...metric,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    } as any);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics if available
    this.sendToAnalytics(metric);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private sendToAnalytics(metric: PerformanceMetrics) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_timing', {
        event_category: 'Performance',
        event_label: metric.componentName,
        value: Math.round(metric.renderTime),
        custom_parameter_mount_time: Math.round(metric.mountTime)
      });
    }

    // Send to custom analytics endpoint
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance_metric',
          data: metric,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error);
      });
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getWebVitals(): Partial<WebVitals> {
    return { ...this.webVitals };
  }

  getAverageMetrics(componentName?: string): Partial<PerformanceMetrics> {
    const filteredMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;

    if (filteredMetrics.length === 0) return {};

    return {
      renderTime: filteredMetrics.reduce((sum, m) => sum + m.renderTime, 0) / filteredMetrics.length,
      mountTime: filteredMetrics.reduce((sum, m) => sum + m.mountTime, 0) / filteredMetrics.length,
      updateTime: filteredMetrics.reduce((sum, m) => sum + (m.updateTime || 0), 0) / filteredMetrics.length,
      memoryUsage: filteredMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / filteredMetrics.length
    };
  }

  generateReport(): string {
    const webVitals = this.getWebVitals();
    const averageMetrics = this.getAverageMetrics();

    return `
Performance Report
==================

Web Vitals:
- Largest Contentful Paint (LCP): ${webVitals.LCP?.toFixed(2) || 'N/A'}ms
- First Input Delay (FID): ${webVitals.FID?.toFixed(2) || 'N/A'}ms  
- Cumulative Layout Shift (CLS): ${webVitals.CLS?.toFixed(4) || 'N/A'}
- First Contentful Paint (FCP): ${webVitals.FCP?.toFixed(2) || 'N/A'}ms
- Time to First Byte (TTFB): ${webVitals.TTFB?.toFixed(2) || 'N/A'}ms

Component Metrics:
- Average Render Time: ${averageMetrics.renderTime?.toFixed(2) || 'N/A'}ms
- Average Mount Time: ${averageMetrics.mountTime?.toFixed(2) || 'N/A'}ms
- Average Update Time: ${averageMetrics.updateTime?.toFixed(2) || 'N/A'}ms
- Average Memory Usage: ${averageMetrics.memoryUsage ? (averageMetrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}

Total Components Monitored: ${this.metrics.length}
    `.trim();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const performanceMonitor = new PerformanceMonitoringService();