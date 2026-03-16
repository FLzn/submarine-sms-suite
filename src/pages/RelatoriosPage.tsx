import { useState } from "react";
import { relatoriosApi, RelatorioSms } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CalendarIcon, FileDown, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function RelatoriosPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [data, setData] = useState<RelatorioSms | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const canGenerate = startDate && endDate;

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim.");
      return;
    }
    if (startDate > endDate) {
      toast.error("A data inicial não pode ser maior que a data final.");
      return;
    }
    try {
      setLoading(true);
      const s = format(startDate, "yyyy-MM-dd");
      const e = format(endDate, "yyyy-MM-dd");
      const result = await relatoriosApi.get(s, e);
      setData(result);
    } catch (err: any) {
      toast.error("Erro ao gerar relatório: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!startDate || !endDate) return;
    try {
      setPdfLoading(true);
      await relatoriosApi.downloadPdf(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      toast.success("PDF baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao baixar PDF: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const chartData = data?.evolucao_diaria.map((d) => {
    const dateStr = d.data.includes("T") ? d.data.split("T")[0] : d.data;
    const parsed = new Date(dateStr + "T12:00:00");
    const isValid = !isNaN(parsed.getTime());
    return {
      ...d,
      label: isValid ? format(parsed, "dd/MM/yyyy", { locale: ptBR }) : dateStr,
    };
  });

  return (
    <div>
      <PageHeader title="Relatórios" description="Gere relatórios de envio de SMS por período" />

      {/* Date selection */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Data início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Data fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    if (d && startDate && d < startDate) {
                      toast.error("Data final não pode ser anterior à inicial.");
                      return;
                    }
                    setEndDate(d);
                  }}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleGenerate} disabled={!canGenerate || loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Gerar Relatório
          </Button>

          {data && (
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading}>
              {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
              Baixar PDF
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && !data && (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Selecione um período e clique em "Gerar Relatório"</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{data.totais.total.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Total SMS</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-success">{data.totais.total_delivered.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-warning">{data.totais.total_pending.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{data.totais.total_error.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {data.totais.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-2xl font-bold text-success">{data.totais.taxa_entrega.toFixed(1)}%</p>
              </div>
              <p className="text-xs text-muted-foreground">Taxa de Entrega</p>
            </div>
          </div>

          {/* Chart */}
          {chartData && chartData.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Evolução Diária</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 20%)" />
                  <XAxis dataKey="label" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) => value}
                    contentStyle={{
                      backgroundColor: "hsl(215 25% 13%)",
                      border: "1px solid hsl(215 20% 20%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 92%)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_delivered" name="Entregues" fill="hsl(160 60% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_error" name="Erros" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table per client */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <h3 className="text-sm font-medium text-foreground">Detalhamento por Cliente</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total</TableHead>
                  <TableHead className="text-muted-foreground text-right">Entregues</TableHead>
                  <TableHead className="text-muted-foreground text-right">Pendentes</TableHead>
                  <TableHead className="text-muted-foreground text-right">Erros</TableHead>
                  <TableHead className="text-muted-foreground text-right">Valor (R$)</TableHead>
                  <TableHead className="text-muted-foreground text-right">Taxa Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.por_cliente.map((c) => (
                  <TableRow key={c.cliente_id} className="border-border/30">
                    <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                    <TableCell className="text-right">{c.total.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right text-success">{c.total_delivered.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right text-warning">{c.total_pending.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right text-destructive">{c.total_error.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{c.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{c.taxa_entrega.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {data.por_cliente.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhum dado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
