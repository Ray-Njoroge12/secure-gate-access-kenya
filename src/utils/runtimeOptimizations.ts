import React, { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Runtime React optimizations for better performance
 */

// Memoized wrapper for expensive components
export const withMemoization = <P extends object>(
  Component: React.ComponentType<P>,
  customComparison?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, customComparison);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
};

// Memory management hook
export const useMemoryManagement = () => {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const clearMemory = useCallback(() => {
    cleanupFunctions.current.forEach(cleanup => cleanup());
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearMemory();
    };
  }, [clearMemory]);

  return { addCleanup, clearMemory };
};

// Optimized state management hook
export const useOptimizedState = <T>(
  initialState: T,
  equalityFn?: (a: T, b: T) => boolean
) => {
  const [state, setState] = React.useState(initialState);
  const previousState = useRef(initialState);

  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState;

      // Use custom equality function or shallow comparison
      const isEqual = equalityFn 
        ? equalityFn(previousState.current, nextState)
        : previousState.current === nextState;

      if (isEqual) {
        return prevState; // No update needed
      }

      previousState.current = nextState;
      return nextState;
    });
  }, [equalityFn]);

  return [state, optimizedSetState] as const;
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;

    if (timeSinceLastCall >= delay) {
      lastCallTime.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [elementRef, entry] as const;
};

// Runtime optimization utilities
export const runtimeOptimizations = {
  // Bundle loading optimization
  preloadChunk: (chunkName: string) => {
    if (typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/assets/${chunkName}`;
    document.head.appendChild(link);
  },

  // Memory usage monitoring
  checkMemoryUsage: () => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }
    const memInfo = (performance as any).memory;
    return {
      used: Math.round(memInfo.usedJSHeapSize / 1048576), // MB
      total: Math.round(memInfo.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memInfo.jsHeapSizeLimit / 1048576), // MB
    };
  },

  // Frame rate monitoring
  monitorFrameRate: (callback: (fps: number) => void) => {
    if (typeof window === 'undefined') return;
    
    let frames = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  },

  // Initialize all runtime optimizations
  init: () => {
    if (typeof window === 'undefined') return;
    
    // Monitor memory usage
    setInterval(() => {
      const memory = runtimeOptimizations.checkMemoryUsage();
      if (memory && memory.used > memory.limit * 0.9) {
        console.warn('High memory usage detected:', memory);
      }
    }, 30000); // Check every 30 seconds

    // Monitor frame rate
    runtimeOptimizations.monitorFrameRate((fps) => {
      if (fps < 50) {
        console.warn('Low frame rate detected:', fps);
      }
    });
  },
};
