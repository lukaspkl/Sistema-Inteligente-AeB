import { ShoppingCart } from "lucide-react";
import PremiumModule from "./PremiumModule";

export default function Compras() {
  return (
    <PremiumModule
      moduleName="Compras"
      moduleIcon={ShoppingCart}
      description="Sistema inteligente de compras e gestão de fornecedores"
      features={[
        "Gestão completa de fornecedores",
        "Cotações automáticas e comparativas", 
        "Controle de contratos e prazos",
        "Análise de performance de fornecedores",
        "Sistema de aprovação por alçadas",
        "Integração com estoque geral",
        "Previsão de demanda por IA",
        "Auditoria completa de compras"
      ]}
    />
  );
}