import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { VisitorRegistration } from "./pages/VisitorRegistration";
import SecurityGuardInterface from "./pages/SecurityGuardInterface";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginForm } from "./components/LoginForm";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/"
            element={<ProtectedRoute><Index /></ProtectedRoute>}
          />
          <Route path="/visitor-registration" element={<VisitorRegistration />} />
          <Route
            path="/security-guard"
            element={<ProtectedRoute requiredRole="guard"><SecurityGuardInterface /></ProtectedRoute>}
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} // Protect admin route
          />
          <Route
            path="/resident-dashboard"
            element={<ProtectedRoute requiredRole="resident"><ResidentDashboard /></ProtectedRoute>}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;