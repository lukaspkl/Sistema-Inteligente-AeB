import { useState } from "react";
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

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClass = (sector: any) => {
    const baseClass = "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200";
    
    if (!sector.active) {
      return `${baseClass} text-muted-foreground cursor-not-allowed opacity-60`;
    }
    
    if (isActive(sector.url)) {
      return `${baseClass} bg-sidebar-primary text-sidebar-primary-foreground shadow-md`;
    }
    
    return `${baseClass} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;
  };

  return (
    <Sidebar 
      className={`${collapsed ? "w-16" : "w-72"} transition-all duration-300 bg-gradient-hero border-r border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-sidebar-border/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shadow-glow">
            <Crown className="h-6 w-6 text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-sidebar-foreground">HotelSys</h2>
              <p className="text-xs text-sidebar-foreground/70">Gestão Inteligente</p>
            </div>
          )}
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider mb-4 opacity-70">
            {!collapsed && "Módulo A&B"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {abSectors.map((sector) => (
                <SidebarMenuItem key={sector.title}>
                  <SidebarMenuButton asChild className="p-0">
                    {sector.active ? (
                      <NavLink to={sector.url} className={getNavClass(sector)}>
                        <sector.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sector.title}</span>
                              {sector.url === "/" && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  Principal
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs opacity-75 truncate">{sector.description}</p>
                          </div>
                        )}
                      </NavLink>
                    ) : (
                      <div className={getNavClass(sector)}>
                        <sector.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sector.title}</span>
                              <Lock className="h-3 w-3" />
                            </div>
                            <p className="text-xs opacity-75 truncate">{sector.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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