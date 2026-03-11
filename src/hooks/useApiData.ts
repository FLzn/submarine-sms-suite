import { useState, useEffect, useCallback } from "react";
import { ApiCliente, ApiCampanha, ApiOperadora, ApiUsuario, clientesApi, campanhasApi, operadorasApi, usuariosApi } from "@/lib/api";
import { toast } from "sonner";

function useApiEntity<T extends { id: number }>(
  fetchFn: () => Promise<T[]>,
  createFn: (data: any) => Promise<T>,
  updateFn: (id: number, data: any) => Promise<T>,
  deleteFn: (id: number) => Promise<any>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFn();
      setItems(data);
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (item: any) => {
    try {
      const created = await createFn(item);
      setItems((prev) => [...prev, created]);
      toast.success("Criado com sucesso");
    } catch (err: any) {
      toast.error("Erro ao criar: " + err.message);
      throw err;
    }
  };

  const update = async (id: number, data: any) => {
    try {
      const updated = await updateFn(id, data);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast.success("Atualizado com sucesso");
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
      throw err;
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteFn(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removido com sucesso");
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
      throw err;
    }
  };

  return { items, loading, add, update, remove, refresh, setItems };
}

export function useApiData() {
  const clientes = useApiEntity<ApiCliente>(
    clientesApi.list, clientesApi.create, clientesApi.update, clientesApi.delete
  );
  const campanhas = useApiEntity<ApiCampanha>(
    campanhasApi.list, campanhasApi.create, campanhasApi.update, campanhasApi.delete
  );
  const operadoras = useApiEntity<ApiOperadora>(
    operadorasApi.list, operadorasApi.create, operadorasApi.update, operadorasApi.delete
  );
  const usuarios = useApiEntity<ApiUsuario>(
    usuariosApi.list, usuariosApi.create, usuariosApi.update, usuariosApi.delete
  );

  return { clientes, campanhas, operadoras, usuarios };
}

export type ApiData = ReturnType<typeof useApiData>;
