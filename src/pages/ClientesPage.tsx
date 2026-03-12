import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { ApiCliente } from "@/lib/api";
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

export default function ClientesPage() {
  const { clientes } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiCliente | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ cnpj_cpf: "", nome: "", code: "", status: "on" as "on" | "off" });

  const openCreate = () => {
    setEditing(null);
    setForm({ cnpj_cpf: "", nome: "", code: "", status: "on" });
    setDialogOpen(true);
  };

  const openEdit = (c: ApiCliente) => {
    setEditing(c);
    setForm({ cnpj_cpf: c.cnpj_cpf, nome: c.nome, code: String(c.code ?? ""), status: c.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { cnpj_cpf: form.cnpj_cpf, nome: form.nome, code: parseInt(form.code, 10), status: form.status };
      if (editing) {
        await clientes.update(editing.id, payload);
      } else {
        await clientes.add(payload);
      }
      setDialogOpen(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: ApiCliente) => {
    await clientes.update(c.id, { status: c.status === "on" ? "off" : "on" });
  };

  if (clientes.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
              <TableHead className="text-muted-foreground">Code</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.items.map((c) => (
              <TableRow key={c.id} className="border-border/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                <TableCell>{c.cnpj_cpf}</TableCell>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="font-mono text-xs">{c.code ?? "—"}</TableCell>
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
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CNPJ/CPF</Label>
              <Input value={form.cnpj_cpf} onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do cliente" />
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
        onConfirm={async () => { if (deleteTarget) await clientes.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.nome || ""}
      />
    </div>
  );
}
