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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout>
        <Routes>
          <Route path="/" element={<ABDashboard />} />
          <Route path="/estoque" element={<ABEstoque />} />
          <Route path="/compras" element={<ABCompras />} />
          <Route path="/notas-fiscais" element={<ABNotasFiscais />} />
          <Route path="/perdas" element={<ABPerdas />} />
          <Route path="/relatorios" element={<ABRelatorios />} />
          <Route path="/configuracoes" element={<ABConfiguracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
