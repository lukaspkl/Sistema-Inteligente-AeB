import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import ABDashboard from "./pages/ABDashboard";
import ABEstoque from "./pages/ABEstoque";
import ABCompras from "./pages/ABCompras";
import ABNotasFiscais from "./pages/ABNotasFiscais";
import ABPerdas from "./pages/ABPerdas";
import ABRelatorios from "./pages/ABRelatorios";
import ABConfiguracoes from "./pages/ABConfiguracoes";
import ABEventos from "./pages/ABEventos";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout><ABDashboard /></Layout>} />
          <Route path="/estoque" element={<Layout><ABEstoque /></Layout>} />
          <Route path="/compras" element={<Layout><ABCompras /></Layout>} />
          <Route path="/notas-fiscais" element={<Layout><ABNotasFiscais /></Layout>} />
          <Route path="/perdas" element={<Layout><ABPerdas /></Layout>} />
          <Route path="/relatorios" element={<Layout><ABRelatorios /></Layout>} />
          <Route path="/eventos" element={<Layout><ABEventos /></Layout>} />
          <Route path="/configuracoes" element={<Layout><ABConfiguracoes /></Layout>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
