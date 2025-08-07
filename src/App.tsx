import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import ABDashboard from "./pages/ABDashboard";
import Governanca from "./pages/Governanca";
import Compras from "./pages/Compras";
import Manutencao from "./pages/Manutencao";
import RH from "./pages/RH";
import Diretoria from "./pages/Diretoria";
import Eventos from "./pages/Eventos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ab" element={<ABDashboard />} />
          <Route path="/governanca" element={<Governanca />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/manutencao" element={<Manutencao />} />
          <Route path="/rh" element={<RH />} />
          <Route path="/diretoria" element={<Diretoria />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
