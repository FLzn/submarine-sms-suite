import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { ApiUsuario } from "@/lib/api";
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

export default function UsuariosPage() {
  const { usuarios } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUsuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUsuario | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ username: "", email: "", password: "", status: "on" as "on" | "off" });

  const openCreate = () => {
    setEditing(null);
    setForm({ username: "", email: "", password: "", status: "on" });
    setDialogOpen(true);
  };

  const openEdit = (u: ApiUsuario) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: "", status: u.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const data: any = { username: form.username, email: form.email, status: form.status };
        if (form.password) data.password = form.password;
        await usuarios.update(editing.id, data);
      } else {
        await usuarios.add(form);
      }
      setDialogOpen(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: ApiUsuario) => {
    await usuarios.update(u.id, { status: u.status === "on" ? "off" : "on" });
  };

  if (usuarios.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Usuários" description="Gerencie os usuários do sistema" onAdd={openCreate} addLabel="Novo Usuário" />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">E-mail</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.items.map((u) => (
              <TableRow key={u.id} className="border-border/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(u)} className="cursor-pointer">
                    <StatusBadge ativo={u.status === "on"} />
                  </button>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Nova Senha (deixe vazio para manter)" : "Senha"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
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
        onConfirm={async () => { if (deleteTarget) await usuarios.remove(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.username || ""}
      />
    </div>
  );
}
