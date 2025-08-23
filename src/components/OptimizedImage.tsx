import React, { useState, useRef, useEffect } from 'react';
import { AssetOptimizer } from '../utils/assetOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  lazy?: boolean;
  className?: string;
  sizes?: string;
  responsive?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 85,
  lazy = true,
  className = '',
  sizes,
  responsive = false,
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [srcSet, setSrcSet] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const assetOptimizer = AssetOptimizer.getInstance();

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        // Optimize the image
        const optimized = await assetOptimizer.optimizeImage(src, {
          width,
          height,
          quality,
          lazy: lazy && !priority,
        });
        setOptimizedSrc(optimized);

        // Generate responsive images if needed
        if (responsive && width) {
          const responsiveSizes = [
            Math.round(width * 0.5),
            width,
            Math.round(width * 1.5),
            Math.round(width * 2),
          ];
          const responsiveSrcSet = assetOptimizer.createResponsiveImageSrcSet(src, responsiveSizes);
          setSrcSet(responsiveSrcSet);
        }
      } catch (error) {
        console.error('Error optimizing image:', error);
        setOptimizedSrc(src); // Fallback to original
      }
    };

    optimizeImage();
  }, [src, width, height, quality, lazy, priority, responsive, assetOptimizer]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Preload high priority images
  useEffect(() => {
    if (priority && optimizedSrc) {
      assetOptimizer.preloadImage(optimizedSrc);
    }
  }, [priority, optimizedSrc, assetOptimizer]);

  // For lazy loading, use data-src instead of src initially
  const imgProps = {
    ref: imgRef,
    alt,
    width,
    height,
    className: `${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${isError ? 'bg-gray-200' : ''}`,
    onLoad: handleLoad,
    onError: handleError,
    loading: lazy && !priority ? ('lazy' as const) : ('eager' as const),
    decoding: 'async' as const,
  };

  if (lazy && !priority) {
    return (
      <img
        {...imgProps}
        data-src={optimizedSrc}
        src={isLoaded ? optimizedSrc : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+'}
        srcSet={srcSet}
        sizes={sizes}
      />
    );
  }

  return (
    <img
      {...imgProps}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
    />
  );
};

// Higher-order component for existing images
export const withOptimizedImage = <P extends object>(
  Component: React.ComponentType<P & { src?: string; alt?: string }>
) => {
  return React.forwardRef<any, P & OptimizedImageProps>((props, ref) => {
    const { src, alt, ...optimizedProps } = props;
    
    if (!src) {
      return <Component {...props as P} ref={ref} />;
    }

    return (
      <OptimizedImage
        src={src}
        alt={alt || ''}
        {...optimizedProps}
      />
    );
  });
};

// Preloader component for critical images
export const ImagePreloader: React.FC<{ images: string[] }> = ({ images }) => {
  const assetOptimizer = AssetOptimizer.getInstance();

  useEffect(() => {
    images.forEach(src => {
      assetOptimizer.preloadImage(src);
    });
  }, [images, assetOptimizer]);

  return null;
};
