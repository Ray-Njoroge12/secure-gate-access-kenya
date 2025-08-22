import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Loading component for lazy routes
const RouteLoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <div className="space-y-2 w-full max-w-md">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// Lazy wrapper component
const LazyRoute = ({ 
  component: Component, 
  fallback,
  ...props 
}: { 
  component: React.ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}) => (
  <Suspense fallback={fallback || <RouteLoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

// Analytics Pages (Feature Chunk)
export const Analytics = lazy(() => import('../pages/Analytics'));
export const AnalyticsDashboard = lazy(() => import('../pages/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
export const BusinessIntelligence = lazy(() => import('../pages/BusinessIntelligence').then(module => ({ default: module.BusinessIntelligence })));
export const AdvancedAnalytics = lazy(() => import('../pages/AdvancedAnalytics').then(module => ({ default: module.AdvancedAnalytics })));
export const AdvancedAnalyticsDashboard = lazy(() => import('../pages/AdvancedAnalyticsDashboard'));
export const PredictiveAnalyticsEngine = lazy(() => import('../pages/PredictiveAnalyticsEngine'));

// Enterprise Pages (Feature Chunk)
export const EnterpriseIntegrationHub = lazy(() => import('../pages/EnterpriseIntegrationHub'));
export const EnterpriseAnalyticsHub = lazy(() => import('../pages/EnterpriseAnalyticsHub'));
export const WorkflowAutomationEngine = lazy(() => import('../pages/WorkflowAutomationEngine'));
export const MultiLocationManager = lazy(() => import('../pages/MultiLocationManager'));
export const APIManagementPortal = lazy(() => import('../pages/APIManagementPortal'));
export const EnterpriseDashboard = lazy(() => import('../pages/EnterpriseDashboard'));

// Security Pages (Feature Chunk)
export const SecurityGuardInterface = lazy(() => import('../pages/SecurityGuardInterface'));
export const SecurityComplianceCenter = lazy(() => import('../pages/SecurityComplianceCenter'));
export const IncidentManagement = lazy(() => import('../pages/IncidentManagement'));
export const EmergencyAlertSystem = lazy(() => import('../pages/EmergencyAlertSystem'));
export const ComplianceReportingCenter = lazy(() => import('../pages/ComplianceReportingCenter'));

// AI Pages (Feature Chunk)
export const AIAnalyticsDashboard = lazy(() => import('../components/AIAnalyticsDashboard'));
export const AIFeaturesDemo = lazy(() => import('../pages/AIFeaturesDemo'));

// Admin & Dashboard Pages (Feature Chunk)
export const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const ResidentDashboard = lazy(() => import('../pages/ResidentDashboard'));

// Core Pages (These can stay in main bundle as they're frequently used)
export const NotificationCenter = lazy(() => import('../pages/NotificationCenter'));

// Visitor Registration Page (used in public routes)
export const VisitorRegistration = lazy(() => import('../pages/VisitorRegistration').then(module => ({ default: module.VisitorRegistration })));

// Export the wrapper component
export { LazyRoute, RouteLoadingFallback };
