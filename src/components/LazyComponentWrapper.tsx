import React, { Suspense, lazy } from 'react';
import { Skeleton } from './ui/skeleton';

interface LazyComponentWrapperProps {
  importFunc: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({ 
  importFunc, 
  fallback, 
  ...props 
}) => {
  const LazyComponent = lazy(importFunc);
  
  return (
    <Suspense fallback={fallback || <Skeleton className="w-full h-48" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyComponentWrapper;