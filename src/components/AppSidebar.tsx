import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChefHat,
  Home,
  ShoppingCart,
  Wrench,
  Users,
  Building,
  Calendar,
  Lock,
  Crown
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

// Futuristic geometric wing for brand consistency (Divine "Bendita")
const TechWing = ({ className, flipped }: { className?: string, flipped?: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    fill="currentColor"
    className={`${className} ${flipped ? '-scale-x-100' : ''}`}
  >
    <polygon points="10,50 40,20 90,10 70,40 90,60 50,60 70,80 30,70" />
  </svg>
);

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const crownIcon = Crown;

const abSectors = [
  {
    title: "Dashboard A&B",
    url: "/",
    icon: Home,
    active: true,
    description: "Visão geral do módulo A&B"
  },
  {
    title: "Estoque",
    url: "/estoque",
    icon: ChefHat,
    active: true,
    description: "Gestão de estoque A&B"
  },
  {
    title: "Compras A&B",
    url: "/compras",
    icon: ShoppingCart,
    active: true,
    description: "Pedidos e fornecedores"
  },
  {
    title: "Notas Fiscais",
    url: "/notas-fiscais",
    icon: Calendar,
    active: true,
    description: "Upload e lançamentos"
  },
  {
    title: "Perdas",
    url: "/perdas",
    icon: Building,
    active: true,
    description: "Controle de perdas A&B"
  },
  {
    title: "Relatórios A&B",
    url: "/relatorios",
    icon: Users,
    active: true,
    description: "Análises e reports"
  },
  {
    title: "Eventos",
    url: "/eventos",
    icon: crownIcon,
    active: true,
    description: "Gestão de eventos e PDF",
    plan: "hotel"
  },
  {
    title: "Configurações A&B",
    url: "/configuracoes",
    icon: Wrench,
    active: true,
    description: "Parâmetros do módulo"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setUserPlan(data.session?.user?.user_metadata?.plan || null);
    });
  }, []);

  const isSectorActive = (sector: any) => {
    if (sector.plan && userPlan !== sector.plan) return false;
    return sector.active;
  };

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClass = (sector: any, isActiveState: boolean) => {
    const baseClass = "group relative flex w-full items-center gap-3 rounded-none border-l-4 border-transparent px-3 py-3 text-sm font-medium transition-all duration-200";

    if (!isActiveState) {
      return `${baseClass} text-muted-foreground cursor-not-allowed opacity-60`;
    }

    if (isActive(sector.url)) {
      return `${baseClass} bg-gradient-to-r from-sidebar-primary/20 to-transparent border-sidebar-primary text-sidebar-primary font-bold shadow-[inset_4px_0_0_0_hsl(var(--sidebar-primary))]`;
    }

    return `${baseClass} text-sidebar-foreground hover:bg-sidebar-accent hover:border-sidebar-primary/50 hover:text-sidebar-accent-foreground`;
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-72"} transition-all duration-300 bg-sidebar-background border-r-2 border-sidebar-border shadow-md`}
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Logo Section */}
        <div className={`flex items-center gap-3 px-4 py-8 border-b border-sidebar-border/50 ${collapsed ? "justify-center" : ""}`}>
          {collapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-none border-2 border-primary bg-background shadow-[4px_4px_0_0_hsl(var(--primary))] shrink-0 hover:scale-105 transition-transform">
              <TechWing className="h-6 w-6 text-primary drop-shadow-[1px_1px_0_hsl(var(--primary-glow)/0.4)]" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center justify-center gap-2">
                <TechWing className="w-8 h-8 text-primary drop-shadow-[2px_2px_0_hsl(var(--primary-glow)/0.3)] opacity-90 -translate-y-[4px]" flipped />

                <h1 className="text-lg font-black tracking-tighter text-primary uppercase drop-shadow-[2px_2px_0_hsl(var(--primary-glow)/0.3)] leading-[0.85] text-center">
                  Bendita
                  <br />
                  <span className="text-sidebar-foreground border-b-2 border-primary inline-block pb-0.5">Comanda</span>
                </h1>

                <TechWing className="w-8 h-8 text-primary drop-shadow-[2px_2px_0_hsl(var(--primary-glow)/0.3)] opacity-90 -translate-y-[4px]" />
              </div>

              <p className="text-[8px] tracking-[0.3em] font-black text-sidebar-foreground/50 uppercase mt-2">
                Gestão Inteligente
              </p>
            </div>
          )}
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider mb-4 opacity-70">
            {!collapsed && "Módulo A&B"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {abSectors.map((sector) => {
                const active = isSectorActive(sector);
                return (
                  <SidebarMenuItem key={sector.title}>
                    <SidebarMenuButton asChild className="p-0">
                      {active ? (
                        <NavLink to={sector.url} className={getNavClass(sector, active)}>
                          <sector.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <div className="flex-1 block">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold leading-none">{sector.title}</span>
                                {sector.url === "/" && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-none h-4">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] font-medium opacity-75 leading-tight overflow-hidden whitespace-nowrap text-ellipsis h-4 block">
                                {sector.description}
                              </div>
                            </div>
                          )}
                        </NavLink>
                      ) : (
                        <div className={getNavClass(sector, active)}>
                          <sector.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <div className="flex-1 block">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold leading-none">{sector.title}</span>
                                <Lock className="h-3 w-3" />
                              </div>
                              <div className="text-[11px] font-medium opacity-75 leading-tight overflow-hidden whitespace-nowrap text-ellipsis h-4 block">
                                {sector.description}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Premium Notice */}
        {!collapsed && (
          <div className="p-4 mt-auto">
            <div className="rounded-xl bg-sidebar-accent/50 p-4 border border-sidebar-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-sidebar-foreground">Plano Premium</span>
              </div>
              <p className="text-xs text-sidebar-foreground/70 mb-3">
                Desbloqueie todos os módulos do sistema
              </p>
              <button className="w-full bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 rounded-lg hover:bg-secondary/90 transition-colors">
                Falar com Desenvolvedor
              </button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}