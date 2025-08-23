import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

// Optimized loading skeletons for different components
export const ChartSkeleton = memo(() => (
  <div className="chart-loading">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading chart...</span>
    </div>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

export const TableSkeleton = memo(() => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-16" />
      </div>
    ))}
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

export const CardSkeleton = memo(() => (
  <div className="card p-6">
    <div className="space-y-3">
      <div className="skeleton h-6 w-32" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-8 w-24" />
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

export const DashboardSkeleton = memo(() => (
  <div className="analytics-grid">
    {[...Array(6)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

// Main optimized route loading component
export const OptimizedRouteLoader = memo<{ 
  message?: string; 
  type?: 'default' | 'chart' | 'table' | 'dashboard' 
}>(({ message = "Loading...", type = 'default' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'chart':
        return <ChartSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      default:
        return (
          <div className="space-y-4 max-w-md w-full">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        );
    }
  };

  return (
    <div className="route-loading prevent-layout-shift">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      {renderSkeleton()}
      <p className="text-sm text-muted-foreground mt-4">{message}</p>
    </div>
  );
});

OptimizedRouteLoader.displayName = 'OptimizedRouteLoader';

// Lazy image component with optimized loading
export const OptimizedImage = memo<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}>(({ src, alt, className = "", width, height }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!loaded && (
        <div 
          className="absolute inset-0 skeleton"
          style={{ width, height }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`img-lazy transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${error ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
      />
      {error && (
        <div 
          className="flex items-center justify-center bg-muted text-muted-foreground text-sm"
          style={{ width, height }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// QR Code loading component
export const QRCodeLoader = memo(() => (
  <div className="qr-code-container">
    <div className="qr-code-loading" />
  </div>
));

QRCodeLoader.displayName = 'QRCodeLoader';

// Virtual scroll item wrapper
export const VirtualScrollItem = memo<{
  children: React.ReactNode;
  index: number;
  height?: number;
}>(({ children, index, height = 60 }) => (
  <div 
    className="virtual-item"
    style={{ 
      minHeight: height,
      transform: `translateY(${index * height}px)`,
      position: 'absolute',
      width: '100%',
      top: 0,
      left: 0
    }}
  >
    {children}
  </div>
));

VirtualScrollItem.displayName = 'VirtualScrollItem';
