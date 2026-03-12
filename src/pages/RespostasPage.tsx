import { useState, useEffect, useMemo } from "react";
import { smsRepliesApi, ApiSmsReply, SmsReplyFilters } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Filter, ChevronLeft, ChevronRight, CalendarIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodFilter = "hoje" | "este_mes" | "mes_passado" | "outro";

function getDateRange(period: PeriodFilter, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  switch (period) {
    case "hoje":
      return { startDate: format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss"), endDate: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case "este_mes": {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return { startDate: format(startOfDay(s), "yyyy-MM-dd'T'HH:mm:ss"), endDate: format(endOfDay(e), "yyyy-MM-dd'T'HH:mm:ss") };
    }
    case "mes_passado": {
      const prev = subMonths(now, 1);
      const s = startOfMonth(prev);
      const e = endOfMonth(prev);
      return { startDate: format(startOfDay(s), "yyyy-MM-dd'T'HH:mm:ss"), endDate: format(endOfDay(e), "yyyy-MM-dd'T'HH:mm:ss") };
    }
    case "outro":
      return {
        startDate: customStart ? format(startOfDay(customStart), "yyyy-MM-dd'T'HH:mm:ss") : undefined,
        endDate: customEnd ? format(endOfDay(customEnd), "yyyy-MM-dd'T'HH:mm:ss") : undefined,
      };
  }
}

export default function RespostasPage() {
  const [replies, setReplies] = useState<ApiSmsReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [period, setPeriod] = useState<PeriodFilter>("hoje");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [appliedFilters, setAppliedFilters] = useState<SmsReplyFilters>({});

  const buildFilters = (): SmsReplyFilters => {
    const range = getDateRange(period, customStart, customEnd);
    return { startDate: range.startDate, endDate: range.endDate };
  };

  const fetchReplies = async (f?: SmsReplyFilters, p = 1) => {
    try {
      setLoading(true);
      const activeFilters = f ?? appliedFilters;
      const res = await smsRepliesApi.list({ ...activeFilters, page: p, limit: 50 });
      setReplies(res.data);
      setPage(res.page);
      setTotalPages(res.pages);
    } catch (err: any) {
      setReplies([]);
      setTotalPages(1);
      setPage(1);
      // Only show toast for non-404 errors (endpoint may not be deployed yet)
      if (!err.message?.includes("404") && !err.message?.includes("Not Found")) {
        toast.error("Erro ao carregar respostas: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const f = buildFilters();
    setAppliedFilters(f);
    fetchReplies(f);
  }, []);

  const applyFilters = () => {
    const f = buildFilters();
    setAppliedFilters(f);
    fetchReplies(f, 1);
  };

  const clearFilters = () => {
    setPeriod("hoje");
    setCustomStart(undefined);
    setCustomEnd(undefined);
    const range = getDateRange("hoje");
    const f: SmsReplyFilters = { startDate: range.startDate, endDate: range.endDate };
    setAppliedFilters(f);
    fetchReplies(f, 1);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchReplies(appliedFilters, p);
  };

  return (
    <div>
      <PageHeader title="Respostas" description="Respostas recebidas de SMS enviados" />

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { value: "hoje" as PeriodFilter, label: "Hoje" },
            { value: "este_mes" as PeriodFilter, label: "Este mês" },
            { value: "mes_passado" as PeriodFilter, label: "Mês passado" },
            { value: "outro" as PeriodFilter, label: "Outro período" },
          ]).map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={period === opt.value ? "default" : "outline"}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {period === "outro" && (
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Data início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={(d) => {
                      if (d && customStart && d < customStart) {
                        toast.error("A data final não pode ser anterior à data inicial.");
                        return;
                      }
                      setCustomEnd(d);
                    }}
                    disabled={(date) => customStart ? date < customStart : false}
                    locale={ptBR}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>
            <Search className="w-3 h-3 mr-1" /> Buscar
          </Button>
          <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar</Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">De</TableHead>
                  <TableHead className="text-muted-foreground">Mensagem</TableHead>
                  <TableHead className="text-muted-foreground">Classificação</TableHead>
                  <TableHead className="text-muted-foreground">Recebido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map((r) => (
                  <TableRow key={r.id} className="border-border/30">
                    <TableCell className="font-mono text-xs">{r.from_number}</TableCell>
                    <TableCell className="max-w-[300px]">{r.message}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                        {r.classify}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.received_at ? format(new Date(r.received_at), "dd/MM/yyyy HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {replies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Nenhuma resposta encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
