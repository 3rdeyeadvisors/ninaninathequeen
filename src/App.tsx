import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCartSync } from "@/hooks/useCartSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
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
import Sustainability from "./pages/Sustainability";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useCartSync();
  
  return (
    <BrowserRouter>
      <ScrollToTop />
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
        <Route path="/demo" element={<Demo />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
