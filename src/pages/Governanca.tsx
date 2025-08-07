import { Crown } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function Governanca() {
  return (
    <PremiumModule
      moduleName="Governança"
      moduleIcon={Crown}
      description="Gestão completa de quartos, limpeza e housekeeping"
      features={[
        "Controle de status dos quartos em tempo real",
        "Agenda de limpeza e manutenção",
        "Checklist digital para camareiras",
        "Relatórios de ocupação e turnover",
        "Gestão de enxoval e amenidades",
        "Sistema de inspetoria automática",
        "Comunicação integrada com recepção",
        "Controle de qualidade por quarto"
      ]}
    />
  );
}