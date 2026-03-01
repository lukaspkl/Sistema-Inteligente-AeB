import { Users } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function RH() {
  return (
    <PremiumModule
      moduleName="RH Operacional"
      moduleIcon={Users}
      description="Gestão completa de recursos humanos operacionais"
      features={[
        "Controle de ponto digital",
        "Gestão de escalas e turnos",
        "Avaliações de desempenho",
        "Treinamentos e capacitações",
        "Controle de uniformes e EPIs",
        "Gestão de benefícios",
        "Relatórios trabalhistas",
        "Sistema de comunicação interna"
      ]}
    />
  );
}