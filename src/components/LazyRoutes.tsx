import React, { Suspense, lazy } from 'react';
import { OptimizedRouteLoader, DashboardSkeleton, ChartSkeleton } from './OptimizedLoading';

// Loading component for lazy routes
const RouteLoadingFallback = ({ message = "Loading...", type = "default" }: { message?: string; type?: string }) => (
  <OptimizedRouteLoader message={message} type={type as any} />
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

// Analytics Pages (Feature Chunk) - with chart loading
export const Analytics = lazy(() => import('../pages/Analytics'));
export const AnalyticsDashboard = lazy(() => import('../pages/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
export const BusinessIntelligence = lazy(() => import('../pages/BusinessIntelligence').then(module => ({ default: module.BusinessIntelligence })));
export const AdvancedAnalytics = lazy(() => import('../pages/AdvancedAnalytics').then(module => ({ default: module.AdvancedAnalytics })));
export const AdvancedAnalyticsDashboard = lazy(() => import('../pages/AdvancedAnalyticsDashboard'));
export const PredictiveAnalyticsEngine = lazy(() => import('../pages/PredictiveAnalyticsEngine'));

// Create wrapped components with specific loading types
export const AnalyticsWithLoading = (props: any) => (
  <Suspense fallback={<OptimizedRouteLoader message="Loading analytics..." type="dashboard" />}>
    <Analytics {...props} />
  </Suspense>
);

export const AnalyticsDashboardWithLoading = (props: any) => (
  <Suspense fallback={<OptimizedRouteLoader message="Loading dashboard..." type="dashboard" />}>
    <AnalyticsDashboard {...props} />
  </Suspense>
);

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
