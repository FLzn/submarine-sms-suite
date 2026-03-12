import { useState, useEffect, useMemo } from "react";
import { smsLogsApi, ApiSmsLog, SmsLogFilters, SmsStats } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
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

export default function DashboardPage() {
  const [logs, setLogs] = useState<ApiSmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SmsLogFilters>({});
  const [tempFilters, setTempFilters] = useState<SmsLogFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<SmsStats>({ total: 0, total_success: 0, total_error: 0, valor_total: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodFilter>("hoje");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const dateRange = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const fetchLogs = async (f?: SmsLogFilters, p = 1) => {
    try {
      setLoading(true);
      const activeFilters = f ?? filters;
      const res = await smsLogsApi.list({ ...activeFilters, page: p, limit: 50 });
      setLogs(res.data);
      setPage(res.page);
      setTotalPages(res.pages);
    } catch (err: any) {
      toast.error("Erro ao carregar logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (f?: SmsLogFilters) => {
    try {
      setStatsLoading(true);
      const activeFilters = f ?? filters;
      const data = await smsLogsApi.stats(activeFilters);
      setStats(data);
    } catch (err: any) {
      toast.error("Erro ao carregar estatísticas: " + err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const buildFilters = (): SmsLogFilters => {
    const range = getDateRange(period, customStart, customEnd);
    return { ...tempFilters, startDate: range.startDate, endDate: range.endDate };
  };

  useEffect(() => {
    const f = buildFilters();
    setFilters(f);
    fetchLogs(f);
    fetchStats(f);
  }, []);

  const applyFilters = () => {
    const f = buildFilters();
    setFilters(f);
    fetchLogs(f, 1);
    fetchStats(f);
  };

  const clearFilters = () => {
    setTempFilters({});
    setPeriod("hoje");
    setCustomStart(undefined);
    setCustomEnd(undefined);
    const f = getDateRange("hoje");
    const newFilters: SmsLogFilters = { startDate: f.startDate, endDate: f.endDate };
    setFilters(newFilters);
    fetchLogs(newFilters, 1);
    fetchStats(newFilters);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchLogs(filters, p);
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Logs de envio de SMS" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {statsLoading ? "—" : stats.total.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground">Total de SMS</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-success">
            {statsLoading ? "—" : stats.total_success.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground">Enviados com sucesso</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">
            {statsLoading ? "—" : stats.total_error.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground">Com erro</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            
            <p className="text-2xl font-bold text-primary">
              {statsLoading ? "—" : stats.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Total gasto</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>

        {/* Period buttons */}
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

        {/* Custom date range */}
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
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    locale={ptBR}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">ID Campanha</Label>
            <Input
              type="number"
              placeholder="Ex: 1"
              value={tempFilters.campanhaId || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, campanhaId: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ID Cliente</Label>
            <Input
              type="number"
              placeholder="Ex: 2"
              value={tempFilters.clienteId || ""}
              onChange={(e) => setTempFilters({ ...tempFilters, clienteId: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
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
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Campanha</TableHead>
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Telefone</TableHead>
                  <TableHead className="text-muted-foreground">Mensagem</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Enviado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-border/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                    <TableCell>{log.campanha?.descricao || "—"}</TableCell>
                    <TableCell>{log.campanha?.cliente?.nome || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.phone_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.message}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          log.status === 0
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                        }
                      >
                        {log.status === 0 ? "Ok" : log.status_description || `Erro ${log.status}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.sent_at ? format(new Date(log.sent_at), "dd/MM/yyyy HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
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
