import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { VisitorRegistration } from "./pages/VisitorRegistration";
import VisitorPortal from "./pages/VisitorPortal";
import SecurityGuardInterface from "./pages/SecurityGuardInterface";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginForm } from "./components/LoginForm";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { TenantProvider } from "./context/TenantProvider";
import { initMonitoring } from "./utils/monitoring";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize service worker update handling
  useServiceWorker();
  
  // Initialize monitoring on app start
  useEffect(() => {
    initMonitoring();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          
          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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