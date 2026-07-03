import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Purchases from "./pages/app/Purchases";
import Sales from "./pages/app/Sales";
import Suppliers from "./pages/app/Suppliers";
import Customers from "./pages/app/Customers";
import UsersPermissions from "./pages/app/UsersPermissions";
import BusinessSettings from "./pages/app/BusinessSettings";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="low-stock" element={<LowStock />} />
            <Route path="movements" element={<Movements />} />
            <Route path="reports" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="settings" element={<BusinessSettings />} />
            {/* Legacy redirects */}
            <Route path="imports" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="suppliers" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="shipments" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="customs" element={<Navigate to="/app/dashboard" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
