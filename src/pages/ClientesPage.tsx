import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Cliente } from "@/hooks/useMockData";
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

export default function ClientesPage() {
  const { clientes } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  const [form, setForm] = useState({ cnpjCpf: "", nome: "", ativo: true });

  const openCreate = () => {
    setEditing(null);
    setForm({ cnpjCpf: "", nome: "", ativo: true });
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({ cnpjCpf: c.cnpjCpf, nome: c.nome, ativo: c.ativo });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      clientes.update(editing.id, form);
    } else {
      clientes.add(form);
    }
    setDialogOpen(false);
  };

  return (
    <div>
      <PageHeader title="Clientes" description="Gerencie seus clientes cadastrados" onAdd={openCreate} addLabel="Novo Cliente" />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">CNPJ/CPF</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.items.map((c) => (
              <TableRow key={c.id} className="border-border/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                <TableCell>{c.cnpjCpf}</TableCell>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.ativo} onCheckedChange={(v) => clientes.update(c.id, { ativo: v })} />
                    <StatusBadge ativo={c.ativo} />
                  </div>
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
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CNPJ/CPF</Label>
              <Input value={form.cnpjCpf} onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do cliente" />
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
        onConfirm={() => { if (deleteTarget) clientes.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.nome || ""}
      />
    </div>
  );
}
