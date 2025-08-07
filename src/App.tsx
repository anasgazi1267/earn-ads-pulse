
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "./contexts/AdminContext";
import Index from "./pages/Index";
import AdminPanel from "./components/AdminPanel";
import NotFound from "./pages/NotFound";
import MonetizationInjector from "./components/MonetizationInjector";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <TooltipProvider>
        <MonetizationInjector />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/*" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
