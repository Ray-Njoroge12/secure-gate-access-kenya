import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { VisitorRegistration } from "./pages/VisitorRegistration";
import VisitorPortal from "./pages/VisitorPortal";
import SecurityGuardInterface from "./pages/SecurityGuardInterface";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { BusinessIntelligence } from "./pages/BusinessIntelligence";
import { AdvancedAnalytics } from "./pages/AdvancedAnalytics";
import NotificationCenter from "./pages/NotificationCenter";
import IncidentManagement from "./pages/IncidentManagement";
import EmergencyAlertSystem from "./pages/EmergencyAlertSystem";
import AdvancedAnalyticsDashboard from "./pages/AdvancedAnalyticsDashboard";
import PredictiveAnalyticsEngine from "./pages/PredictiveAnalyticsEngine";
import ComplianceReportingCenter from "./pages/ComplianceReportingCenter";
import EnterpriseIntegrationHub from "./pages/EnterpriseIntegrationHub";
import EnterpriseAnalyticsHub from "./pages/EnterpriseAnalyticsHub";
import WorkflowAutomationEngine from "./pages/WorkflowAutomationEngine";
import MultiLocationManager from "./pages/MultiLocationManager";
import SecurityComplianceCenter from "./pages/SecurityComplianceCenter";
import APIManagementPortal from "./pages/APIManagementPortal";
import AIAnalyticsDashboard from "./components/AIAnalyticsDashboard";
import AIFeaturesDemo from "./pages/AIFeaturesDemo";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginForm } from "./components/LoginForm";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { TenantProvider } from "./context/TenantProvider";
import { initMonitoring } from "./utils/monitoring";
import { registerServiceWorker, trackMobilePerformance } from "./hooks/usePWA";
import { MobileTouchNavigation, useMobileSwipe } from "./components/MobileTouchNavigation";
import { useDeviceDetection } from "./components/MobileResponsiveLayout";

const queryClient = new QueryClient();

// Mobile Navigation Wrapper Component
const MobileNavigationWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const device = useDeviceDetection();
  const swipeDirection = useMobileSwipe();
  
  // Handle swipe navigation on mobile
  useEffect(() => {
    if (device.isMobile && swipeDirection) {
      // You can implement swipe-based navigation here if needed
      console.log('Swipe detected:', swipeDirection);
    }
  }, [swipeDirection, device.isMobile]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Only show mobile navigation on certain pages
  const showMobileNav = device.isMobile && !['/login', '/auth', '/visitor-portal', '/visitor-registration'].includes(location.pathname);

  return (
    <div className="relative">
      {children}
      {showMobileNav && (
        <MobileTouchNavigation
          currentPath={location.pathname}
          onNavigate={handleNavigation}
        />
      )}
    </div>
  );
};

const AppContent = () => {
  // Initialize service worker update handling
  useServiceWorker();
  
  // Initialize monitoring and PWA on app start
  useEffect(() => {
    initMonitoring();
    registerServiceWorker();
    trackMobilePerformance();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MobileNavigationWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/visitor-portal" element={<VisitorPortal />} />
            <Route path="/visitor-registration" element={<VisitorRegistration />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={<ProtectedRoute><Index /></ProtectedRoute>}
            />
            <Route
              path="/security-guard"
              element={<ProtectedRoute requiredRole="guard"><SecurityGuardInterface /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/resident-dashboard"
              element={<ProtectedRoute requiredRole="resident"><ResidentDashboard /></ProtectedRoute>}
            />
            <Route
              path="/analytics"
              element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>}
            />
            <Route
              path="/notifications"
              element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>}
            />
            <Route
              path="/incidents"
              element={<ProtectedRoute requiredRole={["admin", "guard"]}><IncidentManagement /></ProtectedRoute>}
            />
            <Route
              path="/emergency"
              element={<ProtectedRoute requiredRole={["admin", "guard"]}><EmergencyAlertSystem /></ProtectedRoute>}
            />
            
            {/* Phase 5: Advanced Analytics & Business Intelligence Routes */}
            <Route
              path="/analytics-dashboard"
              element={<ProtectedRoute requiredRole="admin"><AnalyticsDashboard /></ProtectedRoute>}
            />
            <Route
              path="/business-intelligence"
              element={<ProtectedRoute requiredRole="admin"><BusinessIntelligence /></ProtectedRoute>}
            />
            <Route
              path="/ai-analytics"
              element={<ProtectedRoute requiredRole="admin"><AdvancedAnalytics /></ProtectedRoute>}
            />
            <Route
              path="/advanced-analytics"
              element={<ProtectedRoute requiredRole="admin"><AdvancedAnalyticsDashboard /></ProtectedRoute>}
            />
            <Route
              path="/predictive-analytics"
              element={<ProtectedRoute requiredRole="admin"><PredictiveAnalyticsEngine /></ProtectedRoute>}
            />
            <Route
              path="/compliance"
              element={<ProtectedRoute requiredRole="admin"><ComplianceReportingCenter /></ProtectedRoute>}
            />
            {/* Phase 6: Advanced Integration & Enterprise Features */}
            <Route
              path="/enterprise-integration"
              element={<ProtectedRoute requiredRole="admin"><EnterpriseIntegrationHub /></ProtectedRoute>}
            />
            <Route
              path="/workflow-automation"
              element={<ProtectedRoute requiredRole="admin"><WorkflowAutomationEngine /></ProtectedRoute>}
            />
            <Route
              path="/multi-location"
              element={<ProtectedRoute requiredRole="admin"><MultiLocationManager /></ProtectedRoute>}
            />
            <Route
              path="/security-compliance"
              element={<ProtectedRoute requiredRole="admin"><SecurityComplianceCenter /></ProtectedRoute>}
            />
            <Route
              path="/api-management"
              element={<ProtectedRoute requiredRole="admin"><APIManagementPortal /></ProtectedRoute>}
            />
            <Route
              path="/enterprise-analytics"
              element={<ProtectedRoute requiredRole="admin"><EnterpriseAnalyticsHub /></ProtectedRoute>}
            />
            
            {/* Phase 7: AI & Automation Features */}
            <Route
              path="/ai-analytics"
              element={<ProtectedRoute requiredRole="admin"><AIAnalyticsDashboard /></ProtectedRoute>}
            />
            <Route
              path="/ai-demo"
              element={<ProtectedRoute requiredRole="admin"><AIFeaturesDemo /></ProtectedRoute>}
            />
            
            {/* Phase 8: Enterprise Integration & Scalability */}
            <Route
              path="/enterprise-dashboard"
              element={<ProtectedRoute requiredRole="admin"><EnterpriseDashboard /></ProtectedRoute>}
            />
          
          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </MobileNavigationWrapper>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  </QueryClientProvider>
);

export default App;