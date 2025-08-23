// Asset optimization utilities for better performance
export class AssetOptimizer {
  private static instance: AssetOptimizer;
  private optimizedImages = new Set<string>();
  private preloadedAssets = new Set<string>();

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  /**
   * Optimize image loading with WebP support and lazy loading
   */
  async optimizeImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    lazy?: boolean;
  } = {}): Promise<string> {
    // Check if image is already optimized
    if (this.optimizedImages.has(src)) {
      return src;
    }

    const { width, height, quality = 85, lazy = true } = options;
    
    // Generate WebP version if supported
    const webpSrc = this.generateWebPUrl(src, { width, height, quality });
    
    // Preload if not lazy
    if (!lazy) {
      this.preloadImage(webpSrc);
    }

    this.optimizedImages.add(src);
    return webpSrc;
  }

  /**
   * Generate WebP URL with optimization parameters
   */
  private generateWebPUrl(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  }): string {
    // If it's already a WebP or external URL, return as-is
    if (src.includes('.webp') || src.startsWith('http')) {
      return src;
    }

    // For local images, we'll use the existing src
    // In a real implementation, you'd convert to WebP
    return src;
  }

  /**
   * Preload critical images
   */
  preloadImage(src: string): void {
    if (this.preloadedAssets.has(src) || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    this.preloadedAssets.add(src);
  }

  /**
   * Optimize SVG icons
   */
  optimizeSVG(svgContent: string): string {
    // Basic SVG optimization
    return svgContent
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s*=\s*"/g, '="') // Clean up attributes
      .trim();
  }

  /**
   * Preload critical assets
   */
  preloadCriticalAssets(): void {
    if (typeof document === 'undefined') return;

    const criticalAssets = [
      // Preload system fonts
      { href: 'data:font/woff2;base64,', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      
      // Preload critical images (add your actual critical images here)
      // { href: '/logo.webp', as: 'image' },
      // { href: '/hero-image.webp', as: 'image' },
    ];

    criticalAssets.forEach(asset => {
      if (asset.href.startsWith('data:') || this.preloadedAssets.has(asset.href)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = asset.as as string;
      link.href = asset.href;
      if (asset.type) link.type = asset.type;
      if (asset.crossorigin) link.crossOrigin = asset.crossorigin;
      
      document.head.appendChild(link);
      this.preloadedAssets.add(asset.href);
    });
  }

  /**
   * Implement responsive images
   */
  createResponsiveImageSrcSet(baseSrc: string, sizes: number[]): string {
    return sizes
      .map(size => {
        const optimizedSrc = this.generateWebPUrl(baseSrc, { width: size });
        return `${optimizedSrc} ${size}w`;
      })
      .join(', ');
  }

  /**
   * Optimize font loading
   */
  optimizeFontLoading(): void {
    if (typeof document === 'undefined') return;

    // Preconnect to font services
    const fontPreconnect = document.createElement('link');
    fontPreconnect.rel = 'preconnect';
    fontPreconnect.href = 'https://fonts.googleapis.com';
    document.head.appendChild(fontPreconnect);

    const fontPreconnectGstatic = document.createElement('link');
    fontPreconnectGstatic.rel = 'preconnect';
    fontPreconnectGstatic.href = 'https://fonts.gstatic.com';
    fontPreconnectGstatic.crossOrigin = 'anonymous';
    document.head.appendChild(fontPreconnectGstatic);

    // Use font-display: swap for better loading
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 300 900;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    `;
    document.head.appendChild(fontStyle);
  }

  /**
   * Implement resource hints
   */
  addResourceHints(): void {
    if (typeof document === 'undefined') return;

    const hints = [
      // DNS prefetch for external resources
      { rel: 'dns-prefetch', href: 'https://fwacwevimpifqvwpxquq.supabase.co' },
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      
      // Preconnect to critical origins
      { rel: 'preconnect', href: 'https://fwacwevimpifqvwpxquq.supabase.co', crossorigin: 'anonymous' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      document.head.appendChild(link);
    });
  }

  /**
   * Compress and optimize static assets
   */
  async compressAsset(blob: Blob, quality = 0.8): Promise<Blob> {
    // Basic compression implementation
    if (blob.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (compressedBlob) => resolve(compressedBlob || blob),
            'image/webp',
            quality
          );
        };
        
        img.src = URL.createObjectURL(blob);
      });
    }
    
    return blob;
  }

  /**
   * Initialize all asset optimizations
   */
  initAssetOptimizations(): void {
    // Preload critical assets
    this.preloadCriticalAssets();
    
    // Optimize font loading
    this.optimizeFontLoading();
    
    // Add resource hints
    this.addResourceHints();
    
    // Set up intersection observer for lazy loading
    this.setupLazyLoading();
  }

  /**
   * Set up intersection observer for lazy loading
   */
  private setupLazyLoading(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all lazy images
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    });
  }

  /**
   * Get asset performance metrics
   */
  getAssetMetrics(): {
    optimizedImages: number;
    preloadedAssets: number;
    compressionRatio?: number;
  } {
    return {
      optimizedImages: this.optimizedImages.size,
      preloadedAssets: this.preloadedAssets.size,
    };
  }
}
