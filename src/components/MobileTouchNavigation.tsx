import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Shield, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface MobileTouchNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/' },
  { id: 'visitors', label: 'Visitors', icon: <Users size={20} />, path: '/visitors' },
  { id: 'security', label: 'Security', icon: <Shield size={20} />, path: '/security' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
];

export function MobileTouchNavigation({ currentPath, onNavigate, className }: MobileTouchNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Only consider horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setDragDirection(deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    if (dragDirection === 'right' && !isExpanded) {
      setIsExpanded(true);
    } else if (dragDirection === 'left' && isExpanded) {
      setIsExpanded(false);
    }
    
    setIsDragging(false);
    setDragDirection(null);
  };

  // Auto-collapse after navigation
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, currentPath]);

  const handleNavigation = (path: string) => {
    onNavigate(path);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700",
          "md:hidden", // Hide on desktop
          className
        )}
      >
        {/* Quick Action Bar */}
        <div className="flex items-center justify-around px-2 py-1 bg-gray-50 dark:bg-gray-800">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
                "min-w-[60px] active:scale-95",
                currentPath === item.path
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {item.badge && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
          
          {/* Expand Menu Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
              "min-w-[60px] active:scale-95",
              isExpanded 
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {isExpanded ? <X size={20} /> : <Menu size={20} />}
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Slide-up Navigation Panel */}
      <div
        ref={navRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900",
          "transform transition-transform duration-300 ease-out",
          "border-t border-gray-200 dark:border-gray-700",
          "md:hidden", // Hide on desktop
          isExpanded ? "translate-y-0" : "translate-y-full"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Extended Navigation */}
        <div className="px-4 pb-6 pt-2 space-y-2 max-h-64 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "text-left active:scale-98",
                currentPath === item.path
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}

// Mobile Swipe Detector Hook
export function useMobileSwipe() {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only consider horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
        
        // Clear direction after a short delay
        setTimeout(() => setSwipeDirection(null), 100);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return swipeDirection;
}

// Touch-friendly Button Component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function TouchButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: TouchButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 active:bg-gray-400",
    danger: "bg-red-600 hover:bg-red-700 text-white active:bg-red-800"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-4 py-3 text-base min-h-[48px]",
    lg: "px-6 py-4 text-lg min-h-[56px]"
  };

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all duration-200",
        "touch-manipulation select-none",
        "active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
