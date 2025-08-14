#!/usr/bin/env node

/**
 * PHASE 3: UI/UX Enhancement & Performance Optimization Plan
 * Generated: 2025-08-14T22:20:00.000Z
 * Purpose: Enhance user experience, improve performance, and streamline interfaces
 * 
 * Expected Outcomes:
 * - Reduced UI loading times by 60%
 * - Improved accessibility compliance to WCAG 2.1 AA
 * - Enhanced mobile responsiveness
 * - Streamlined user workflows
 * - Performance optimization
 */

import fs from 'fs';
import path from 'path';

const PHASE3_PLAN = {
  title: "Phase 3: UI/UX Enhancement & Performance Optimization",
  description: "Enhance user experience, improve performance, and streamline interfaces",
  categories: [
    {
      name: "Performance Optimization",
      priority: "HIGH",
      tasks: [
        "Implement lazy loading for components",
        "Add React.memo for expensive components", 
        "Optimize bundle size with code splitting",
        "Add performance monitoring",
        "Implement service worker for caching"
      ]
    },
    {
      name: "Mobile Responsiveness",
      priority: "HIGH", 
      tasks: [
        "Enhance mobile navigation",
        "Optimize touch interactions",
        "Improve mobile forms UX",
        "Add mobile-specific components",
        "Test cross-device compatibility"
      ]
    },
    {
      name: "Accessibility Improvements",
      priority: "MEDIUM",
      tasks: [
        "Add ARIA labels and roles",
        "Improve keyboard navigation",
        "Enhance screen reader support",
        "Add focus management",
        "Improve color contrast"
      ]
    },
    {
      name: "User Interface Polish",
      priority: "MEDIUM",
      tasks: [
        "Add loading states and skeletons",
        "Improve error handling UI",
        "Add success/confirmation states",
        "Enhance form validation UX",
        "Add animated transitions"
      ]
    }
  ]
};

console.log("🚀 Starting Phase 3: UI/UX Enhancement & Performance Optimization...\n");

// Create Phase 3 implementation files
async function implementPhase3() {
  try {
    // 1. Create performance optimization components
    await createPerformanceComponents();
    
    // 2. Create mobile-responsive enhancements
    await createMobileEnhancements();
    
    // 3. Create accessibility improvements
    await createAccessibilityComponents();
    
    // 4. Create UI polish components
    await createUIPolishComponents();
    
    // 5. Update existing components with enhancements
    await enhanceExistingComponents();
    
    // 6. Create performance monitoring
    await createPerformanceMonitoring();
    
    console.log("✅ Phase 3 implementation completed successfully!");
    console.log("\n📋 Summary of Phase 3 Enhancements:");
    console.log("- ⚡ Performance optimization components created");
    console.log("- 📱 Mobile responsiveness enhanced");
    console.log("- ♿ Accessibility improvements implemented");
    console.log("- ✨ UI polish and animations added");
    console.log("- 📊 Performance monitoring established");
    
  } catch (error) {
    console.error("❌ Phase 3 implementation failed:", error);
    process.exit(1);
  }
}

async function createPerformanceComponents() {
  console.log("⚡ Creating performance optimization components...");
  
  // Lazy loading wrapper
  const lazyWrapperComponent = `import React, { Suspense, lazy } from 'react';
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

export default LazyComponentWrapper;`;

  // Performance monitoring hook
  const performanceHook = `import { useEffect, useRef } from 'react';

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
    console.debug(\`🔍 Performance [\${componentName}]:\`, {
      mountTime: \`\${mountTime.toFixed(2)}ms\`,
      renderTime: \`\${(performance.now() - renderStartTime.current).toFixed(2)}ms\`
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
};`;

  // Memoized components
  const memoizedComponents = `import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface VisitorCardProps {
  visitor: {
    id: string;
    name: string;
    email: string;
    status: string;
    visitDate: string;
  };
  onStatusChange: (id: string, status: string) => void;
}

export const VisitorCard = memo<VisitorCardProps>(({ visitor, onStatusChange }) => {
  const statusColor = useMemo(() => {
    switch (visitor.status) {
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'checked-out': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }, [visitor.status]);

  const formattedDate = useMemo(() => {
    return new Date(visitor.visitDate).toLocaleDateString();
  }, [visitor.visitDate]);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{visitor.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{visitor.email}</p>
          <div className="flex justify-between items-center">
            <span className={\`px-2 py-1 rounded-full text-xs \${statusColor}\`}>
              {visitor.status}
            </span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VisitorCard.displayName = 'VisitorCard';`;

  // Write performance components
  fs.writeFileSync('src/components/LazyComponentWrapper.tsx', lazyWrapperComponent);
  fs.writeFileSync('src/hooks/usePerformanceMonitor.ts', performanceHook);
  fs.writeFileSync('src/components/VisitorCard.tsx', memoizedComponents);
}

async function createMobileEnhancements() {
  console.log("📱 Creating mobile responsiveness enhancements...");
  
  // Mobile navigation component
  const mobileNavComponent = `import React, { useState } from 'react';
import { Menu, X, Home, Users, BarChart3, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Visitors', path: '/visitors' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};`;

  // Mobile form enhancements
  const mobileFormComponent = `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

const mobileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
});

type MobileFormData = z.infer<typeof mobileFormSchema>;

interface MobileOptimizedFormProps {
  onSubmit: (data: MobileFormData) => Promise<void>;
  isLoading?: boolean;
}

export const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<MobileFormData>({
    resolver: zodResolver(mobileFormSchema),
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: MobileFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Visitor Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="text-16px" // Prevents zoom on iOS
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="text-16px"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="text-16px"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Visit Purpose</Label>
            <Input
              id="purpose"
              type="text"
              placeholder="Reason for visit"
              className="text-16px"
              {...register('purpose')}
            />
            {errors.purpose && (
              <p className="text-sm text-red-500">{errors.purpose.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};`;

  // Touch-optimized components
  const touchComponents = `import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={\`
        \${sizeClasses[size]}
        \${variantClasses[variant]}
        min-w-[44px] min-h-[44px]
        touch-manipulation
        active:scale-95
        transition-transform duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
      \`}
    >
      {children}
    </Button>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [startX, setStartX] = React.useState<number | null>(null);
  const [currentX, setCurrentX] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (startX === null || currentX === null) return;

    const diffX = startX - currentX;
    const threshold = 50;

    if (diffX > threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (diffX < -threshold && onSwipeRight) {
      onSwipeRight();
    }

    setStartX(null);
    setCurrentX(null);
  };

  return (
    <Card
      className="touch-manipulation select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};`;

  // Write mobile enhancement components
  fs.writeFileSync('src/components/MobileNavigation.tsx', mobileNavComponent);
  fs.writeFileSync('src/components/MobileOptimizedForm.tsx', mobileFormComponent);
  fs.writeFileSync('src/components/TouchComponents.tsx', touchComponents);
}

async function createAccessibilityComponents() {
  console.log("♿ Creating accessibility improvements...");
  
  // Accessibility hook
  const accessibilityHook = `import { useEffect, useRef } from 'react';

export const useAccessibility = () => {
  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  return { announceMessage, focusElement };
};

export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };

  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      container.addEventListener('keydown', handleTabKey);
      
      return () => {
        container.removeEventListener('keydown', handleTabKey);
      };
    }, [containerRef]);
  };

  return { saveFocus, restoreFocus, trapFocus };
};`;

  // Accessible components
  const accessibleComponents = `import React, { useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { useFocusManagement } from '@/hooks/useAccessibility';

interface AccessibleAlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  description,
  onClose,
  autoFocus = false
}) => {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && alertRef.current) {
      alertRef.current.focus();
    }
  }, [autoFocus]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'success': return 'Success message';
      case 'error': return 'Error message';
      case 'warning': return 'Warning message';
      case 'info': return 'Information message';
    }
  };

  return (
    <Alert
      ref={alertRef}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="alert"
      aria-label={getAriaLabel()}
      tabIndex={autoFocus ? 0 : -1}
    >
      {getIcon()}
      <div className="flex-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close alert"
          className="ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      // Focus the modal after it opens
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus]);

  trapFocus(modalRef);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={\`bg-white rounded-lg shadow-xl \${sizeClasses[size]} w-full focus:outline-none focus:ring-2 focus:ring-blue-500\`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};`;

  // Write accessibility components
  fs.writeFileSync('src/hooks/useAccessibility.ts', accessibilityHook);
  fs.writeFileSync('src/components/AccessibleComponents.tsx', accessibleComponents);
}

async function createUIPolishComponents() {
  console.log("✨ Creating UI polish components...");
  
  // Loading states
  const loadingComponents = `import React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

export const LoadingState: React.FC<{ type?: 'list' | 'form' | 'card' | 'table' }> = ({
  type = 'card'
}) => {
  switch (type) {
    case 'list':
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      );
    
    case 'form':
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      );
    
    case 'table':
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      );
    
    default:
      return (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      );
  }
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 text-sm text-gray-600 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};`;

  // Animation components
  const animationComponents = `import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up'
}) => {
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 20 };
      case 'down': return { opacity: 0, y: -20 };
      case 'left': return { opacity: 0, x: 20 };
      case 'right': return { opacity: 0, x: -20 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  isVisible,
  direction = 'right'
}) => {
  const variants = {
    hidden: {
      left: { x: '-100%' },
      right: { x: '100%' },
      up: { y: '-100%' },
      down: { y: '100%' }
    }[direction],
    visible: { x: 0, y: 0 }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{ hidden: variants.hidden, visible: variants.visible }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PulseProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export const Pulse: React.FC<PulseProps> = ({ children, isActive = true }) => {
  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {children}
    </motion.div>
  );
};`;

  // Status and feedback components
  const statusComponents = `import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'pending' | 'info';
  text: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'error':
        return {
          icon: XCircle,
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        };
      case 'pending':
        return {
          icon: Clock,
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      default:
        return {
          icon: AlertCircle,
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={\`
      inline-flex items-center gap-1 rounded-full border
      \${config.bg} \${config.text} \${config.border}
      \${sizeClasses[size]}
    \`}>
      <Icon className={iconSizes[size]} />
      {text}
    </span>
  );
};

interface ProgressIndicatorProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  showPercentage = true,
  size = 'md'
}) => {
  const percentage = Math.round((current / total) * 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <div className={\`bg-gray-200 rounded-full \${sizeClasses[size]} overflow-hidden\`}>
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: \`\${percentage}%\` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{current} of {total}</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
};`;

  // Write UI polish components
  fs.writeFileSync('src/components/LoadingState.tsx', loadingComponents);
  fs.writeFileSync('src/components/AnimationComponents.tsx', animationComponents);
  fs.writeFileSync('src/components/StatusComponents.tsx', statusComponents);
}

async function enhanceExistingComponents() {
  console.log("🔧 Enhancing existing components...");
  
  // Enhanced AuthForm with better UX
  const enhancedAuthForm = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { FadeIn } from './AnimationComponents';
import { useAccessibility } from '@/hooks/useAccessibility';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface EnhancedAuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
}

export const EnhancedAuthForm: React.FC<EnhancedAuthFormProps> = ({
  mode,
  onSubmit,
  isLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { announceMessage } = useAccessibility();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: 'onChange'
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const handleFormSubmit = async (data: AuthFormData) => {
    try {
      await onSubmit(data);
      announceMessage(\`Successfully \${mode === 'login' ? 'logged in' : 'registered'}\`);
      toast({
        title: "Success",
        description: \`Successfully \${mode === 'login' ? 'logged in' : 'registered'}\`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      announceMessage(\`Error: \${errorMessage}\`, 'assertive');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very Weak';
    return { strength, text: strengthText };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  return (
    <FadeIn>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={\`
                    pr-10
                    \${errors.email ? 'border-red-500 focus:border-red-500' : ''}
                    \${touchedFields.email && !errors.email ? 'border-green-500' : ''}
                  \`}
                  {...register('email')}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {touchedFields.email && !errors.email && watchedEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={\`
                    pr-10
                    \${errors.password ? 'border-red-500 focus:border-red-500' : ''}
                    \${touchedFields.password && !errors.password ? 'border-green-500' : ''}
                  \`}
                  {...register('password')}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {mode === 'register' && watchedPassword && (
                <div className="space-y-1">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={\`h-1 flex-1 rounded \${
                          i < passwordStrength.strength ? 'bg-green-500' : 'bg-gray-200'
                        }\`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Password strength: {passwordStrength.text}
                  </p>
                </div>
              )}
              
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
              
              {!errors.password && mode === 'register' && (
                <p id="password-help" className="text-xs text-gray-600">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={!isValid || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading 
                ? \`\${mode === 'login' ? 'Signing In' : 'Creating Account'}...\` 
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
};`;

  // Write enhanced components
  fs.writeFileSync('src/components/EnhancedAuthForm.tsx', enhancedAuthForm);
}

async function createPerformanceMonitoring() {
  console.log("📊 Creating performance monitoring...");
  
  // Performance monitoring service
  const performanceService = `export interface PerformanceMetrics {
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

    return \`
Performance Report
==================

Web Vitals:
- Largest Contentful Paint (LCP): \${webVitals.LCP?.toFixed(2) || 'N/A'}ms
- First Input Delay (FID): \${webVitals.FID?.toFixed(2) || 'N/A'}ms  
- Cumulative Layout Shift (CLS): \${webVitals.CLS?.toFixed(4) || 'N/A'}
- First Contentful Paint (FCP): \${webVitals.FCP?.toFixed(2) || 'N/A'}ms
- Time to First Byte (TTFB): \${webVitals.TTFB?.toFixed(2) || 'N/A'}ms

Component Metrics:
- Average Render Time: \${averageMetrics.renderTime?.toFixed(2) || 'N/A'}ms
- Average Mount Time: \${averageMetrics.mountTime?.toFixed(2) || 'N/A'}ms
- Average Update Time: \${averageMetrics.updateTime?.toFixed(2) || 'N/A'}ms
- Average Memory Usage: \${averageMetrics.memoryUsage ? (averageMetrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}

Total Components Monitored: \${this.metrics.length}
    \`.trim();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const performanceMonitor = new PerformanceMonitoringService();`;

  // Performance dashboard component
  const performanceDashboard = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { performanceMonitor, WebVitals, PerformanceMetrics } from '@/services/performanceService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceDashboard: React.FC = () => {
  const [webVitals, setWebVitals] = useState<Partial<WebVitals>>({});
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    const updateData = () => {
      setWebVitals(performanceMonitor.getWebVitals());
      setMetrics(performanceMonitor.getMetrics());
      setReport(performanceMonitor.generateReport());
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getVitalStatus = (vital: string, value: number | undefined) => {
    if (!value) return 'unknown';
    
    switch (vital) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'FID':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = metrics.slice(-10).map((metric, index) => ({
    name: \`\${metric.componentName}-\${index}\`,
    renderTime: metric.renderTime,
    mountTime: metric.mountTime,
    updateTime: metric.updateTime || 0
  }));

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`performance-report-\${new Date().toISOString().split('T')[0]}.txt\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button onClick={downloadReport}>Download Report</Button>
      </div>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(webVitals).map(([vital, value]) => {
              const status = getVitalStatus(vital, value);
              return (
                <div key={vital} className="text-center">
                  <div className="text-2xl font-bold">
                    {value ? value.toFixed(2) : 'N/A'}
                    {vital !== 'CLS' && 'ms'}
                  </div>
                  <div className="text-sm text-gray-600">{vital}</div>
                  <Badge className={\`mt-1 \${getStatusColor(status)}\`}>
                    {status.replace('-', ' ')}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Component Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Component Performance (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="renderTime" fill="#8884d8" name="Render Time (ms)" />
              <Bar dataKey="mountTime" fill="#82ca9d" name="Mount Time (ms)" />
              <Bar dataKey="updateTime" fill="#ffc658" name="Update Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
            {report}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};`;

  // Write performance monitoring
  fs.writeFileSync('src/services/performanceService.ts', performanceService);
  fs.writeFileSync('src/components/PerformanceDashboard.tsx', performanceDashboard);
}

// Run Phase 3 implementation
implementPhase3().catch(console.error);
