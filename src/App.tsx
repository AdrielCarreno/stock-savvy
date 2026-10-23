import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isStandaloneDisplay, shouldBlockLanding, standaloneEntryPath } from "@/lib/standalone";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/app/Dashboard";
import Products from "./pages/app/Products";
import Movements from "./pages/app/Movements";
import LowStock from "./pages/app/LowStock";
import Integrations from "./pages/app/Integrations";
import Suppliers from "./pages/app/Suppliers";
import UsersPermissions from "./pages/app/UsersPermissions";
import BusinessSettings from "./pages/app/BusinessSettings";
import Reports from "./pages/app/Reports";
import AI from "./pages/app/AI";
import POS from "./pages/app/POS";

const queryClient = new QueryClient();

/**
 * En la app instalada (PWA standalone) la landing nunca se muestra:
 * se redirige a /login (o al workspace si ya hay sesión).
 */
function StandaloneLandingGate() {
  const standalone = isStandaloneDisplay();
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const blocked = shouldBlockLanding(standalone, pathname);

  useEffect(() => {
    if (!standalone || loading || pathname !== "/") return;
    navigate(standaloneEntryPath(!!user), { replace: true });
  }, [standalone, loading, user, pathname, navigate]);

  if (!blocked) return null;
  // Pantalla en blanco mientras se resuelve la sesión / redirección:
  // la landing jamás llega a renderizarse dentro de la app instalada.
  return <div className="min-h-screen bg-background" />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/auth/callback" element={<AuthCallback />} />

    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/app/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="products" element={<Products />} />
      <Route path="pos" element={<POS />} />
      <Route path="low-stock" element={<LowStock />} />
      <Route path="movements" element={<Movements />} />
      <Route path="suppliers" element={<Suppliers />} />
      <Route path="integrations" element={<Integrations />} />
      <Route path="reports" element={<Reports />} />
      <Route path="ai" element={<AI />} />
      <Route path="users" element={<UsersPermissions />} />
      <Route path="settings" element={<BusinessSettings />} />
      {/* Redirects for merged/removed sections */}
      <Route path="purchases" element={<Navigate to="/app/movements?tab=purchases" replace />} />
      <Route path="sales" element={<Navigate to="/app/movements?tab=sales" replace />} />
      <Route path="accounting" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="customers" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="imports" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="shipments" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="customs" element={<Navigate to="/app/dashboard" replace />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <StandaloneLandingGate />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
