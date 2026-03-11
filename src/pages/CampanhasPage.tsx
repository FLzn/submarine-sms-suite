import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Campanha } from "@/hooks/useMockData";
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
import { Pencil, Trash2 } from "lucide-react";

export default function CampanhasPage() {
  const { campanhas, clientes } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campanha | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campanha | null>(null);

  const [form, setForm] = useState({ clienteId: 0, descricao: "", valorSms: 0, token: "", ativo: true });

  const getClienteName = (id: number) => clientes.items.find((c) => c.id === id)?.nome || "—";

  const openCreate = () => {
    setEditing(null);
    setForm({ clienteId: clientes.items[0]?.id || 0, descricao: "", valorSms: 0, token: "", ativo: true });
    setDialogOpen(true);
  };

  const openEdit = (c: Campanha) => {
    setEditing(c);
    setForm({ clienteId: c.clienteId, descricao: c.descricao, valorSms: c.valorSms, token: c.token, ativo: c.ativo });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      campanhas.update(editing.id, form);
    } else {
      campanhas.add(form);
    }
    setDialogOpen(false);
  };

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
                <TableCell>{getClienteName(c.clienteId)}</TableCell>
                <TableCell className="font-medium">{c.descricao}</TableCell>
                <TableCell>R$ {c.valorSms.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">{c.token}</TableCell>
                <TableCell>
                  <button onClick={() => campanhas.update(c.id, { ativo: !c.ativo })} className="cursor-pointer">
                    <StatusBadge ativo={c.ativo} />
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
              <Select value={String(form.clienteId)} onValueChange={(v) => setForm({ ...form, clienteId: Number(v) })}>
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
              <Input type="number" step="0.01" value={form.valorSms} onChange={(e) => setForm({ ...form, valorSms: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Token</Label>
              <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Token da campanha" />
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
        onConfirm={() => { if (deleteTarget) campanhas.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.descricao || ""}
      />
    </div>
  );
}
