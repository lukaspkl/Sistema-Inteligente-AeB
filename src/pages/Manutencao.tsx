import { Wrench } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function Manutencao() {
  return (
    <PremiumModule
      moduleName="Manutenção"
      moduleIcon={Wrench}
      description="Gestão inteligente de manutenção preventiva e corretiva"
      features={[
        "Ordens de serviço digitais",
        "Manutenção preventiva programada",
        "Controle de peças e ferramentas",
        "Histórico completo de equipamentos",
        "Sistema de prioridades automático",
        "Relatórios de custos e eficiência",
        "Integração com fornecedores externos",
        "Dashboard de performance técnica"
      ]}
    />
  );
}