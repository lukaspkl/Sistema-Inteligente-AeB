import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, UtensilsCrossed } from "lucide-react";

// Futuristic geometric wing to match "Bold & Tech" style + "Bendita" (Divine)
const TechWing = ({ className, flipped }: { className?: string, flipped?: boolean }) => (
    <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={`${className} ${flipped ? '-scale-x-100' : ''}`}
    >
        <polygon points="10,50 40,20 90,10 70,40 90,60 50,60 70,80 30,70" />
    </svg>
);

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (presetEmail?: string) => {
        setLoading(true);
        const targetEmail = presetEmail || email;

        // Using mock auth
        const { error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password || '123456', // Mock accepts any password
        });

        setLoading(false);

        if (error) {
            toast({
                variant: "destructive",
                title: "Erro ao acessar",
                description: "Credenciais inválidas. Tente novamente.",
            });
            return;
        }

        toast({
            title: "Login realizado com sucesso",
            description: "Bem-vindo ao Bendita Comanda.",
        });

        navigate("/");
    };

    return (
        <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-between px-4 pt-2 pb-4 relative overflow-hidden">

            {/* Fundo Estilo Grade / Comanda de Operações */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none"></div>

            {/* Title Section (Top) */}
            <div className="w-full max-w-md z-10 text-center bg-background/80 backdrop-blur pt-2 pb-4 border-b-2 border-dashed border-border shrink-0">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <TechWing className="w-10 h-10 sm:w-16 sm:h-16 text-primary drop-shadow-[4px_4px_0_hsl(var(--primary-glow)/0.3)] opacity-90" flipped />

                    <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tighter uppercase drop-shadow-[4px_4px_0_hsl(var(--primary-glow)/0.3)] leading-none">
                        Bendita
                        <br />
                        <span className="text-foreground border-b-4 border-primary inline-block pb-1">Comanda</span>
                    </h1>

                    <TechWing className="w-10 h-10 sm:w-16 sm:h-16 text-primary drop-shadow-[4px_4px_0_hsl(var(--primary-glow)/0.3)] opacity-90" />
                </div>

                <p className="mt-4 text-[10px] sm:text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    Gestão de Estoque Inteligente
                </p>
            </div>

            {/* Card Section (Middle) */}
            <div className="z-10 w-full max-w-sm my-auto flex flex-col justify-center py-4">

                <Card className="border-4 border-dashed border-border bg-card/90 backdrop-blur shadow-[6px_6px_0_0_hsl(var(--primary))] rounded-none">
                    <CardHeader className="border-b-2 border-dashed border-border bg-muted/20 pb-3">
                        <CardTitle className="text-lg uppercase font-bold tracking-tight leading-tight">O que você vai gerenciar hoje?</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-primary">
                            Selecione o plano de demonstração
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-3">

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-16 flex-col gap-0.5 hover:bg-primary/20 hover:text-primary transition-all border-4 shadow-[4px_4px_0_0_hsl(var(--border))] hover:shadow-[2px_2px_0_0_hsl(var(--primary))]"
                                onClick={() => handleLogin('admin@hotel.com')}
                                disabled={loading}
                            >
                                <Building2 className="h-4 w-4" />
                                <span className="text-[9px] sm:text-[10px]">Hotel (Plan Grand)</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-16 flex-col gap-0.5 hover:bg-primary/20 hover:text-primary transition-all border-4 shadow-[4px_4px_0_0_hsl(var(--border))] hover:shadow-[2px_2px_0_0_hsl(var(--primary))]"
                                onClick={() => handleLogin('admin@bistro.com')}
                                disabled={loading}
                            >
                                <UtensilsCrossed className="h-4 w-4" />
                                <span className="text-[9px] sm:text-[10px]">Bistrô (Plan Lite)</span>
                            </Button>
                        </div>

                        <div className="relative mt-2 mb-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t-2 border-dashed border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="bg-card px-4 text-muted-foreground">Ou Acesso Manual</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Input
                                placeholder="E-MAIL"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-2 font-bold focus-visible:ring-0 focus-visible:border-primary uppercase h-9 shadow-[4px_4px_0_0_hsl(var(--border))] bg-background"
                            />
                            <Input
                                placeholder="SENHA"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border-2 font-bold focus-visible:ring-0 focus-visible:border-primary uppercase h-9 shadow-[4px_4px_0_0_hsl(var(--border))] bg-background"
                            />
                        </div>

                    </CardContent>
                    <CardFooter className="bg-muted/10 pt-3 border-t-2 border-dashed border-border">
                        <Button className="w-full h-9 text-xs drop-shadow-none" onClick={() => handleLogin()} disabled={loading}>
                            ENTRAR NO SISTEMA
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Footer LucasDev (Bottom) */}
            <div className="z-10 text-center w-full shrink-0 mb-4">
                <a
                    href="https://lucas-portfolio-seven.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block group"
                >
                    <div className="bg-background/80 backdrop-blur px-6 py-2 border-2 border-border shadow-[4px_4px_0_0_hsl(var(--border))] group-hover:shadow-[2px_2px_0_0_hsl(var(--primary))] group-hover:border-primary transition-all">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground group-hover:text-primary transition-colors hover:cursor-pointer">
                            Desenvolvido por <span className="text-primary group-hover:text-foreground">LucasDev</span>
                        </p>
                    </div>
                </a>
            </div>

        </div>
    );
}
