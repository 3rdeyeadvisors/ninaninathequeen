import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { useCartSync } from "@/hooks/useCartSync";
import { useCloudAuthStore } from "@/stores/cloudAuthStore";
import { useAdminStore } from "@/stores/adminStore";
import { ADMIN_EMAIL } from "@/stores/authStore";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { DbSyncProvider, useDbSync } from "@/providers/DbSyncProvider";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import MixAndMatch from "./pages/MixAndMatch";
import SizeQuiz from "./pages/SizeQuiz";
import FittingRoom from "./pages/FittingRoom";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminPOS from "./pages/admin/POS";
import AdminSettings from "./pages/admin/Settings";
import SearchPage from "./pages/Search";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Sustainability from "./pages/Sustainability";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import Demo from "./pages/Demo";
import Maintenance from "./pages/Maintenance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { settings } = useAdminStore();
  const { isInitialized } = useDbSync();
  const { user } = useCloudAuthStore();
  const isAdmin = user?.isAdmin || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Wait for initial database sync to complete before determining maintenance state
  // This ensures that isMaintenanceMode, seoTitle, and social links are correctly
  // hydrated from the database before the UI is rendered.
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-pulse font-serif text-2xl tracking-[0.3em] text-primary/40">NINA ARMEND</div>
      </div>
    );
  }

  if (settings.isMaintenanceMode && !isAdmin) {
    return <Maintenance />;
  }

  return <>{children}</>;
}

// Capture referral code and redirect to account page
function InviteCapture() {
  const { code } = useParams<{ code: string }>();
  if (code) {
    localStorage.setItem('referral_code', code);
  }
  return <Navigate to="/account" replace />;
}

function AppContent() {
  useCartSync();
  const { initialize } = useCloudAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <BrowserRouter>
      <ScrollToTop />
      <MaintenanceGuard>
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:handle" element={<ProductPage />} />
        <Route path="/mix-and-match" element={<MixAndMatch />} />
        <Route path="/size-quiz" element={<SizeQuiz />} />
        <Route path="/fitting-room" element={<FittingRoom />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute adminOnly>
            <AdminProducts />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute adminOnly>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/customers" element={
          <ProtectedRoute adminOnly>
            <AdminCustomers />
          </ProtectedRoute>
        } />
        <Route path="/admin/pos" element={
          <ProtectedRoute adminOnly>
            <AdminPOS />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute adminOnly>
            <AdminSettings />
          </ProtectedRoute>
        } />

        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/about" element={<About />} />
        <Route path="/sustainability" element={<Sustainability />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/invite/:code" element={<InviteCapture />} />
        <Route path="/demo" element={<Demo />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </MaintenanceGuard>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DbSyncProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </DbSyncProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
