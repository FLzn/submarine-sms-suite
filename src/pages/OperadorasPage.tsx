import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Operadora } from "@/hooks/useMockData";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OperadorasPage() {
  const { operadoras } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Operadora | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Operadora | null>(null);

  const [form, setForm] = useState({ nome: "", endpointSms: "", ativo: true });

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: "", endpointSms: "", ativo: true });
    setDialogOpen(true);
  };

  const openEdit = (o: Operadora) => {
    setEditing(o);
    setForm({ nome: o.nome, endpointSms: o.endpointSms, ativo: o.ativo });
    setDialogOpen(true);
  };

  const handleSave = () => {
    // If activating this one, deactivate all others
    if (form.ativo) {
      operadoras.items.forEach((o) => {
        if (o.id !== editing?.id && o.ativo) {
          operadoras.update(o.id, { ativo: false });
        }
      });
      toast.info("Apenas uma operadora pode estar ativa por vez. As demais foram desativadas.");
    }

    if (editing) {
      operadoras.update(editing.id, form);
    } else {
      operadoras.add(form);
    }
    setDialogOpen(false);
  };

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
                <TableCell className="font-mono text-xs">{o.endpointSms}</TableCell>
                <TableCell>
                  <button onClick={() => {
                    const newAtivo = !o.ativo;
                    if (newAtivo) {
                      operadoras.items.forEach((op) => {
                        if (op.id !== o.id && op.ativo) operadoras.update(op.id, { ativo: false });
                      });
                      toast.info("Apenas uma operadora pode estar ativa por vez. As demais foram desativadas.");
                    }
                    operadoras.update(o.id, { ativo: newAtivo });
                  }} className="cursor-pointer">
                    <StatusBadge ativo={o.ativo} />
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
              <Input value={form.endpointSms} onChange={(e) => setForm({ ...form, endpointSms: e.target.value })} placeholder="https://api.operadora.com/sms" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) operadoras.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.nome || ""}
      />
    </div>
  );
}
