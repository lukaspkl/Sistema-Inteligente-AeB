import { Calendar } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function Eventos() {
  return (
    <PremiumModule
      moduleName="Eventos e Comercial"
      moduleIcon={Calendar}
      description="Gestão completa de eventos e estratégias comerciais"
      features={[
        "Agenda de eventos integrada",
        "Orçamentos e propostas automáticas",
        "Controle de montagem e desmontagem",
        "Gestão de equipamentos A/V",
        "Cardápios e serviços personalizados",
        "CRM para eventos corporativos",
        "Relatórios de rentabilidade",
        "Sistema de feedback pós-evento"
      ]}
    />
  );
}