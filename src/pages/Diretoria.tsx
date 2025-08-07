import { Building } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function Diretoria() {
  return (
    <PremiumModule
      moduleName="Diretoria"
      moduleIcon={Building}
      description="Dashboards executivos e relatórios estratégicos"
      features={[
        "Dashboard executivo em tempo real",
        "KPIs e métricas estratégicas",
        "Relatórios financeiros avançados",
        "Análise de performance setorial",
        "Projeções e forecasting",
        "Comparativos de mercado",
        "Relatórios regulatórios",
        "Business Intelligence integrado"
      ]}
    />
  );
}