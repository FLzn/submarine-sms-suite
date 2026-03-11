import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { ApiOperadora } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OperadorasPage() {
  const { operadoras } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiOperadora | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiOperadora | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ nome: "", endpoint_sms: "", status: "on" as "on" | "off" });

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: "", endpoint_sms: "", status: "on" });
    setDialogOpen(true);
  };

  const openEdit = (o: ApiOperadora) => {
    setEditing(o);
    setForm({ nome: o.nome, endpoint_sms: o.endpoint_sms, status: o.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form.status === "on") {
        // Deactivate all others first
        for (const o of operadoras.items) {
          if (o.id !== editing?.id && o.status === "on") {
            await operadoras.update(o.id, { status: "off" });
          }
        }
        toast.info("Apenas uma operadora pode estar ativa por vez.");
      }
      if (editing) {
        await operadoras.update(editing.id, form);
      } else {
        await operadoras.add(form);
      }
      setDialogOpen(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (o: ApiOperadora) => {
    const newStatus = o.status === "on" ? "off" : "on";
    if (newStatus === "on") {
      for (const op of operadoras.items) {
        if (op.id !== o.id && op.status === "on") {
          await operadoras.update(op.id, { status: "off" });
        }
      }
      toast.info("Apenas uma operadora pode estar ativa por vez.");
    }
    await operadoras.update(o.id, { status: newStatus });
  };

  if (operadoras.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Operadoras" description="Gerencie as operadoras de SMS" onAdd={openCreate} addLabel="Nova Operadora" />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Endpoint SMS</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operadoras.items.map((o) => (
              <TableRow key={o.id} className="border-border/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{o.id}</TableCell>
                <TableCell className="font-medium">{o.nome}</TableCell>
                <TableCell className="font-mono text-xs">{o.endpoint_sms}</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(o)} className="cursor-pointer">
                    <StatusBadge ativo={o.status === "on"} />
                  </button>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(o)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Operadora" : "Nova Operadora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da operadora" />
            </div>
            <div className="space-y-2">
              <Label>Endpoint SMS</Label>
              <Input value={form.endpoint_sms} onChange={(e) => setForm({ ...form, endpoint_sms: e.target.value })} placeholder="https://api.operadora.com/sms" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.status === "on"} onCheckedChange={(v) => setForm({ ...form, status: v ? "on" : "off" })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget) await operadoras.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.nome || ""}
      />
    </div>
  );
}
