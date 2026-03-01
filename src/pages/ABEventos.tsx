import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Plus, FileText, ChefHat, Receipt, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Evento {
    id: string;
    nome: string;
    data_evento: string;
    convidados: number;
    local: string;
    status: 'pendente' | 'confirmado' | 'finalizado';
    responsavel: string;
}

interface EventoItem {
    id: string;
    evento_id: string;
    nome: string;
    categoria: string;
    preco_sugerido: number;
}

export default function ABEventos() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('eventos').select('*');
        if (error) {
            toast({
                variant: "destructive",
                title: "Erro ao carregar eventos",
                description: error.message
            });
        } else {
            setEventos(data || []);
        }
        setLoading(false);
    };

    const generateMenuPDF = async (evento: Evento) => {
        const { data: itens, error } = await supabase
            .from('evento_itens')
            .select('*')
            .eq('evento_id', evento.id);

        if (error || !itens) {
            toast({ variant: "destructive", title: "Erro ao buscar itens", description: "Não foi possível carregar o cardápio." });
            return;
        }

        const doc = new jsPDF();
        const primaryColor = [16, 185, 129]; // Emerald (match primary)

        // --- Header Divine ---
        doc.setFillColor(31, 41, 55); // Dark Slate
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("BENDITA COMANDA", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.text("GESTÃO INTELIGENTE DE EVENTOS", 105, 28, { align: "center" });

        // --- Body ---
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(18);
        doc.text(evento.nome.toUpperCase(), 15, 55);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`DATA: ${new Date(evento.data_evento).toLocaleDateString()}`, 15, 62);
        doc.text(`LOCAL: ${evento.local.toUpperCase()}`, 15, 67);
        doc.text(`CONVIDADOS: ${evento.convidados}`, 15, 72);

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.line(15, 78, 195, 78);

        // --- Menu Content ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("CARDÁPIO SUGERIDO", 105, 90, { align: "center" });

        const categories = Array.from(new Set(itens.map(i => i.categoria))) as string[];
        let currentY = 100;

        categories.forEach(cat => {
            if (currentY > 260) { doc.addPage(); currentY = 20; }
            doc.setFontSize(12);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(cat.toUpperCase(), 15, currentY);
            currentY += 2;
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.1);
            doc.line(15, currentY, 195, currentY);
            currentY += 8;

            doc.setFontSize(11);
            doc.setTextColor(55, 65, 81);
            doc.setFont("helvetica", "normal");

            itens.filter(i => i.categoria === cat).forEach(item => {
                if (currentY > 275) { doc.addPage(); currentY = 20; }
                doc.text(`• ${item.nome}`, 20, currentY);
                currentY += 6;
            });
            currentY += 5;
        });

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Gerado por Bendita Comanda - Responsável: ${evento.responsavel}`, 105, 285, { align: "center" });

        doc.save(`cardapio_${evento.id}.pdf`);

        toast({ title: "PDF Gerado", description: "O cardápio foi exportado com sucesso." });
    };

    const generateKitchenPDF = async (evento: Evento) => {
        const { data: itens, error } = await supabase.from('evento_itens').select('*').eq('evento_id', evento.id);
        if (error || !itens) return;

        const doc = new jsPDF();
        doc.setFillColor(55, 65, 81);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("FICHA DE PRODUÇÃO - COZINHA", 105, 15, { align: "center" });
        doc.setFontSize(10);
        doc.text(`EVENTO: ${evento.nome.toUpperCase()} | DATA: ${new Date(evento.data_evento).toLocaleDateString()}`, 105, 22, { align: "center" });

        autoTable(doc, {
            startY: 40,
            head: [['Categoria', 'Item', 'Qtd. Estimada (Pessoas)']],
            body: itens.map(i => [i.categoria, i.nome, evento.convidados]),
            theme: 'grid',
            headStyles: { fillColor: [55, 65, 81] }
        });

        doc.save(`cozinha_${evento.id}.pdf`);
    };

    const generateBudgetPDF = async (evento: Evento) => {
        const { data: itens, error } = await supabase.from('evento_itens').select('*').eq('evento_id', evento.id);
        if (error || !itens) return;

        const doc = new jsPDF();
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("ORÇAMENTO COMERCIAL - BENDITA COMANDA", 105, 15, { align: "center" });

        let total = 0;
        const rows = itens.map(i => {
            const subtotal = i.preco_sugerido * evento.convidados;
            total += subtotal;
            return [i.categoria, i.nome, `R$ ${i.preco_sugerido.toFixed(2)}`, evento.convidados, `R$ ${subtotal.toFixed(2)}`];
        });

        autoTable(doc, {
            startY: 40,
            head: [['Categoria', 'Item', 'Vlr. Unit', 'Pessoas', 'Total']],
            body: rows,
            foot: [['', '', '', 'TOTAL GERAL', `R$ ${total.toFixed(2)}`]],
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        doc.save(`orcamento_${evento.id}.pdf`);
    };

    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
    const [itensEvento, setItensEvento] = useState<EventoItem[]>([]);
    const [newItem, setNewItem] = useState({ nome: '', categoria: 'Prato Principal', preco: '' });
    const [showNewEventDialog, setShowNewEventDialog] = useState(false);
    const [newEventData, setNewEventData] = useState({
        nome: '',
        data_evento: new Date().toISOString().split('T')[0],
        convidados: 50,
        local: '',
        responsavel: ''
    });

    const openMenuManager = async (evento: Evento) => {
        setSelectedEvento(evento);
        const { data } = await supabase.from('evento_itens').select('*').eq('evento_id', evento.id);
        setItensEvento(data || []);
    };

    const handleCreateEvento = async () => {
        if (!newEventData.nome || !newEventData.local) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha o nome e o local do evento." });
            return;
        }

        const { error } = await supabase.from('eventos').insert({
            ...newEventData,
            status: 'pendente'
        });

        if (!error) {
            toast({ title: "Evento Criado", description: "O evento foi agendado com sucesso!" });
            setShowNewEventDialog(false);
            setNewEventData({
                nome: '',
                data_evento: new Date().toISOString().split('T')[0],
                convidados: 50,
                local: '',
                responsavel: ''
            });
            fetchEventos();
        }
    };

    const addItem = async () => {
        if (!selectedEvento || !newItem.nome) return;
        const item = {
            evento_id: selectedEvento.id,
            nome: newItem.nome,
            categoria: newItem.categoria,
            preco_sugerido: parseFloat(newItem.preco) || 0
        };
        const { data, error } = await supabase.from('evento_itens').insert(item).select();
        if (!error && data) {
            setItensEvento([...itensEvento, data[0]]);
            setNewItem({ nome: '', categoria: 'Prato Principal', preco: '' });
            toast({ title: "Item Adicionado", description: "O prato foi incluído no cardápio." });
        }
    };

    const removeItem = async (id: string) => {
        const { error } = await supabase.from('evento_itens').delete().eq('id', id);
        if (!error) {
            setItensEvento(itensEvento.filter(i => i.id !== id));
        }
    };

    const getStatusBadge = (status: Evento['status']) => {
        switch (status) {
            case 'confirmado':
                return <Badge className="bg-green-500/20 text-green-500 border-green-500/50 uppercase font-bold text-[10px]">Confirmado</Badge>;
            case 'pendente':
                return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 uppercase font-bold text-[10px]">Pendente</Badge>;
            case 'finalizado':
                return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 uppercase font-bold text-[10px]">Finalizado</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-dashed border-border pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase text-primary drop-shadow-[2px_2px_0_hsl(var(--primary-glow)/0.3)]">
                        Gestão de Eventos
                    </h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
                        Planejamento e Cardápios Premium
                    </p>
                </div>

                <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
                    <DialogTrigger asChild>
                        <Button className="font-bold border-2 shadow-[4px_4px_0_0_hsl(var(--primary))] hover:shadow-[2px_2px_0_0_hsl(var(--primary))] transition-all rounded-none uppercase text-xs h-12 px-6">
                            <Plus className="mr-2 h-4 w-4" /> Novo Evento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-2 border-primary shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] rounded-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Agendar Novo Evento</DialogTitle>
                            <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Preencha os dados básicos do evento</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Título do Evento</Label>
                                <Input
                                    className="rounded-none border-2 focus:ring-0"
                                    placeholder="Ex: Casamento Silva & Santos"
                                    value={newEventData.nome}
                                    onChange={(e) => setNewEventData({ ...newEventData, nome: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Data</Label>
                                    <Input
                                        type="date"
                                        className="rounded-none border-2 focus:ring-0"
                                        value={newEventData.data_evento}
                                        onChange={(e) => setNewEventData({ ...newEventData, data_evento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Qtd. Convidados</Label>
                                    <Input
                                        type="number"
                                        className="rounded-none border-2 focus:ring-0"
                                        value={newEventData.convidados}
                                        onChange={(e) => setNewEventData({ ...newEventData, convidados: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Local / Salão</Label>
                                <Input
                                    className="rounded-none border-2 focus:ring-0"
                                    placeholder="Ex: Salão de Festas Principal"
                                    value={newEventData.local}
                                    onChange={(e) => setNewEventData({ ...newEventData, local: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Responsável / Organizador</Label>
                                <Input
                                    className="rounded-none border-2 focus:ring-0"
                                    placeholder="Ex: Nome do Organizador"
                                    value={newEventData.responsavel}
                                    onChange={(e) => setNewEventData({ ...newEventData, responsavel: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateEvento} className="w-full rounded-none font-black uppercase border-2 shadow-[4px_4px_0_0_hsl(var(--primary))] hover:shadow-none transition-all h-12">
                                Criar Evento e Abrir Planejamento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse bg-card/50 border-2 border-dashed border-border h-48" />
                    ))
                ) : eventos.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Nenhum evento agendado</p>
                    </div>
                ) : (
                    eventos.map((evento) => (
                        <Card key={evento.id} className="group border-2 border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-all shadow-[4px_4px_0_0_hsl(var(--border))] hover:shadow-[6px_6px_0_0_hsl(var(--primary-glow)/0.2)] rounded-none overflow-hidden">
                            <CardHeader className="pb-3 border-b border-dashed border-border/50">
                                <div className="flex justify-between items-start mb-2">
                                    {getStatusBadge(evento.status)}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground line-clamp-1">
                                    {evento.nome}
                                </CardTitle>
                                <div className="flex items-center text-[11px] font-bold text-muted-foreground uppercase gap-4 mt-2">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(evento.data_evento).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {evento.convidados} Pessoas</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    <span className="uppercase">{evento.local}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="flex-col h-14 gap-1 border-2 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/20 hover:border-primary transition-all rounded-none"
                                                onClick={() => openMenuManager(evento)}
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Montar
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-card border-2 border-primary shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] rounded-none">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Montar Cardápio</DialogTitle>
                                                <DialogDescription className="font-bold uppercase text-[10px] tracking-widest">{selectedEvento?.nome}</DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-12 gap-2 items-end border-b-2 border-dashed border-border pb-6">
                                                    <div className="col-span-12 sm:col-span-5 space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Nome do Prato/Bebida</Label>
                                                        <Input
                                                            value={newItem.nome}
                                                            onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
                                                            className="rounded-none border-2 focus:ring-0 h-9"
                                                        />
                                                    </div>
                                                    <div className="col-span-6 sm:col-span-4 space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Categoria</Label>
                                                        <Select value={newItem.categoria} onValueChange={(v) => setNewItem({ ...newItem, categoria: v })}>
                                                            <SelectTrigger className="rounded-none border-2 h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Entrada">Entrada</SelectItem>
                                                                <SelectItem value="Prato Principal">Prato Principal</SelectItem>
                                                                <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                                                                <SelectItem value="Sobremesa">Sobremesa</SelectItem>
                                                                <SelectItem value="Bebidas">Bebidas</SelectItem>
                                                                <SelectItem value="Outros">Outros</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-6 sm:col-span-3 space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Preço Sug.</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                value={newItem.preco}
                                                                onChange={(e) => setNewItem({ ...newItem, preco: e.target.value })}
                                                                className="rounded-none border-2 focus:ring-0 h-9"
                                                            />
                                                            <Button onClick={addItem} className="rounded-none font-bold border-2 h-9">
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                    {itensEvento.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-border group hover:border-primary transition-colors">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-primary uppercase leading-none">{item.categoria}</span>
                                                                <span className="text-sm font-bold uppercase tracking-tight">{item.nome}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm font-black">R$ {item.preco_sugerido.toFixed(2)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeItem(item.id)}
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {itensEvento.length === 0 && (
                                                        <p className="text-center py-8 text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50 italic">
                                                            Nenhum item adicionado ao cardápio
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        variant="outline"
                                        className="flex-col h-14 gap-1 border-2 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:border-primary transition-all rounded-none"
                                        onClick={() => generateMenuPDF(evento)}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Menu
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-col h-14 gap-1 border-2 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:border-primary transition-all rounded-none"
                                        onClick={() => generateKitchenPDF(evento)}
                                    >
                                        <ChefHat className="h-4 w-4" />
                                        Cozinha
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-col h-14 gap-1 border-2 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:border-primary transition-all rounded-none"
                                        onClick={() => generateBudgetPDF(evento)}
                                    >
                                        <Receipt className="h-4 w-4" />
                                        Orçamento
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
