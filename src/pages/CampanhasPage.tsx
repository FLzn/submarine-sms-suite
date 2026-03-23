import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { ApiCampanha } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export default function CampanhasPage() {
  const { campanhas, clientes } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCampanha | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCampanha | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ cliente_id: 0, descricao: "", valor_sms: "", token: "", status: "on" as "on" | "off" });

  const getClienteName = (id: number) => clientes.items.find((c) => c.id === id)?.nome || "—";

  const openCreate = () => {
    setEditing(null);
    setForm({ cliente_id: clientes.items[0]?.id || 0, descricao: "", valor_sms: "", token: "", status: "on" });
    setDialogOpen(true);
  };

  const openEdit = (c: ApiCampanha) => {
    setEditing(c);
    setForm({ cliente_id: c.cliente_id, descricao: c.descricao, valor_sms: c.valor_sms, token: c.token, status: c.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, valor_sms: Number(form.valor_sms) } as any;
      if (editing) {
        await campanhas.update(editing.id, payload);
      } else {
        await campanhas.add(payload);
      }
      setDialogOpen(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: ApiCampanha) => {
    await campanhas.update(c.id, { status: c.status === "on" ? "off" : "on" });
  };

  if (campanhas.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Campanhas" description="Gerencie suas campanhas de SMS" onAdd={openCreate} addLabel="Nova Campanha" />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-muted-foreground">Valor SMS</TableHead>
              <TableHead className="text-muted-foreground">Token</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.items.map((c) => (
              <TableRow key={c.id} className="border-border/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                <TableCell>{getClienteName(c.cliente_id)}</TableCell>
                <TableCell className="font-medium">{c.descricao}</TableCell>
                <TableCell>R$ {Number(c.valor_sms).toFixed(4)}</TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">{c.token}</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(c)} className="cursor-pointer">
                    <StatusBadge ativo={c.status === "on"} />
                  </button>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={String(form.cliente_id)} onValueChange={(v) => setForm({ ...form, cliente_id: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.items.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da campanha" />
            </div>
            <div className="space-y-2">
              <Label>Valor SMS (R$)</Label>
              <Input type="number" step="0.0001" value={form.valor_sms} onChange={(e) => setForm({ ...form, valor_sms: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Token</Label>
              <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Token da campanha" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.status === "on"} onCheckedChange={(v) => setForm({ ...form, status: v ? "on" : "off" })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.descricao.trim() || !form.token.trim() || !(Number(form.valor_sms) > 0) || !form.cliente_id}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) await campanhas.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.descricao || ""}
      />
    </div>
  );
}
