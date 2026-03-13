import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { preferenciasApi, type ApiPreferencias } from "@/lib/api";

export default function PreferenciasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleanupEnabled, setCleanupEnabled] = useState(false);
  const [intervalMonths, setIntervalMonths] = useState(3);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    preferenciasApi.get()
      .then((data) => {
        setCleanupEnabled(data.cleanup_enabled);
        setIntervalMonths(data.cleanup_interval_months);
      })
      .catch(() => {
        toast({ title: "Erro ao carregar preferências", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (intervalMonths < 1) {
      toast({ title: "O intervalo deve ser no mínimo 1 mês", variant: "destructive" });
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    try {
      const data = await preferenciasApi.update({
        cleanup_enabled: cleanupEnabled,
        cleanup_interval_months: intervalMonths,
      });
      setCleanupEnabled(data.cleanup_enabled);
      setIntervalMonths(data.cleanup_interval_months);
      setSaveStatus("success");
      toast({ title: "Preferências salvas com sucesso" });
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch {
      setSaveStatus("error");
      toast({ title: "Erro ao salvar preferências", variant: "destructive" });
      setTimeout(() => setSaveStatus("idle"), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Preferências</h1>
        <p className="text-sm text-muted-foreground mt-1">Configurações globais do sistema</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Limpeza automática de SMS</CardTitle>
          <CardDescription>
            Configure a remoção automática de registros antigos de SMS para liberar espaço.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="cleanup-toggle" className="text-sm font-medium">
              Ativar limpeza automática
            </Label>
            <Switch
              id="cleanup-toggle"
              checked={cleanupEnabled}
              onCheckedChange={setCleanupEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval-months" className="text-sm font-medium">
              Remover SMS mais antigos que:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="interval-months"
                type="number"
                min={1}
                step={1}
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={!cleanupEnabled}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">meses</span>
            </div>
          </div>

          {cleanupEnabled && (
            <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-warning">
                SMS e respostas anteriores ao período configurado serão excluídos permanentemente toda meia-noite.
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
