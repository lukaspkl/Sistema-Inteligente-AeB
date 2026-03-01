import { Bell, Search, User, Menu, MessageSquare, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSessionUser(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const user = {
    name: sessionUser ? sessionUser.email.split('@')[0] : "Carregando...",
    role: sessionUser?.user_metadata?.company_name || 'Autenticando',
    avatar: sessionUser ? sessionUser.email.substring(0, 2).toUpperCase() : "AA",
    aiUsage: 15,
    aiLimit: sessionUser?.user_metadata?.plan === 'hotel' ? 500 : 50
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border shadow-[0_4px_0_0_hsl(var(--shadow-md)/0.1)] bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground" />

          {/* Search */}
          <div className="relative hidden md:flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar no sistema..."
              className="w-64 pl-10 bg-background border-2 border-border focus-visible:ring-0 focus-visible:border-primary transition-colors rounded-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* AI Usage Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-none bg-primary/10 border-2 border-primary shadow-[2px_2px_0_0_hsl(var(--primary))] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_hsl(var(--primary))] transition-all">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight text-primary">
              IA: {user.aiUsage}/{user.aiLimit}
            </span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-border rounded-none transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary text-primary-foreground text-sm font-bold shadow-[2px_2px_0_0_hsl(var(--primary-glow))]">
                  {user.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Histórico IA ({user.aiUsage} prompts)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}