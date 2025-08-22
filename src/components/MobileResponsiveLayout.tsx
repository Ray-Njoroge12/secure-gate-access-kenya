import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

// Hook to detect device type and screen size
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: 'landscape' as 'portrait' | 'landscape',
    touchEnabled: false,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation,
        touchEnabled,
        userAgent: navigator.userAgent
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

export function MobileResponsiveLayout({ 
  children, 
  sidebar, 
  header, 
  footer, 
  className 
}: MobileResponsiveLayoutProps) {
  const device = useDeviceDetection();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on mobile when clicking outside
  useEffect(() => {
    if (device.isMobile && sidebarOpen) {
      const handleClickOutside = () => setSidebarOpen(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [device.isMobile, sidebarOpen]);

  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900",
        "flex flex-col",
        className
      )}
      style={{
        // CSS custom properties for responsive design
        '--mobile-vh': `${device.screenHeight * 0.01}px`,
        '--screen-width': `${device.screenWidth}px`,
        '--screen-height': `${device.screenHeight}px`
      } as React.CSSProperties}
    >
      {/* Header */}
      {header && (
        <header className={cn(
          "sticky top-0 z-40 bg-white dark:bg-gray-800",
          "border-b border-gray-200 dark:border-gray-700",
          device.isMobile ? "px-4 py-3" : "px-6 py-4"
        )}>
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Desktop Sidebar */}
            {device.isDesktop && (
              <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                {sidebar}
              </aside>
            )}

            {/* Mobile Sidebar Overlay */}
            {device.isMobile && (
              <>
                <div
                  className={cn(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                  onClick={() => setSidebarOpen(false)}
                />
                <aside
                  className={cn(
                    "fixed left-0 top-0 z-50 h-full w-80 max-w-[80vw]",
                    "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
                    "transform transition-transform duration-300 ease-in-out overflow-y-auto",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                  )}
                >
                  {sidebar}
                </aside>
              </>
            )}

            {/* Tablet Sidebar */}
            {device.isTablet && (
              <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                {sidebar}
              </aside>
            )}
          </>
        )}

        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 overflow-y-auto",
            device.isMobile ? "px-4 py-4" : "px-6 py-6",
            // Add bottom padding for mobile navigation
            device.isMobile ? "pb-20" : ""
          )}
          style={{
            // Ensure proper height calculation on mobile
            minHeight: device.isMobile ? 'calc(100vh - 140px)' : 'auto'
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && !device.isMobile && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {footer}
        </footer>
      )}
    </div>
  );
}

// Mobile-specific utility components
export function MobileContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "mx-auto max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-6xl",
      "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
}

export function MobileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm",
      "border border-gray-200 dark:border-gray-700",
      "p-4 sm:p-6",
      className
    )}>
      {children}
    </div>
  );
}

export function MobileGrid({ 
  children, 
  columns = 1,
  gap = 4,
  className 
}: { 
  children: React.ReactNode; 
  columns?: number;
  gap?: number;
  className?: string;
}) {
  const device = useDeviceDetection();
  
  const getGridCols = () => {
    if (device.isMobile) return 1;
    if (device.isTablet) return Math.min(2, columns);
    return columns;
  };

  return (
    <div 
      className={cn(
        "grid gap-4",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
}

// Touch-friendly form components
export function MobileFormField({ 
  label, 
  children, 
  error,
  required = false,
  className 
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className={cn(
        "block text-sm font-medium text-gray-700 dark:text-gray-300",
        required && "after:content-['*'] after:text-red-500 after:ml-1"
      )}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function MobileInput({ 
  className, 
  type = "text",
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
        "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "touch-manipulation", // Improves touch response
        "min-h-[48px]", // Minimum touch target size
        className
      )}
      {...props}
    />
  );
}

export function MobileTextarea({ 
  className, 
  rows = 4,
  ...props 
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
        "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "touch-manipulation resize-none",
        "min-h-[96px]", // Minimum touch target size
        className
      )}
      {...props}
    />
  );
}
