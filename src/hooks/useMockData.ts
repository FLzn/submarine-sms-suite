import { useState } from "react";

export interface Cliente {
  id: number;
  cnpjCpf: string;
  nome: string;
  ativo: boolean;
}

export interface Campanha {
  id: number;
  clienteId: number;
  descricao: string;
  valorSms: number;
  token: string;
  ativo: boolean;
}

export interface Operadora {
  id: number;
  nome: string;
  endpointSms: string;
  ativo: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  senha?: string;
  ativo: boolean;
}

const initialClientes: Cliente[] = [
  { id: 1, cnpjCpf: "12.345.678/0001-90", nome: "Empresa Alpha", ativo: true },
  { id: 2, cnpjCpf: "98.765.432/0001-10", nome: "Beta Corp", ativo: true },
  { id: 3, cnpjCpf: "111.222.333-44", nome: "Carlos Silva", ativo: false },
];

const initialCampanhas: Campanha[] = [
  { id: 1, clienteId: 1, descricao: "Promoção de Verão", valorSms: 0.05, token: "abc123", ativo: true },
  { id: 2, clienteId: 2, descricao: "Campanha Black Friday", valorSms: 0.03, token: "xyz789", ativo: false },
];

const initialOperadoras: Operadora[] = [
  { id: 1, nome: "Vivo", endpointSms: "https://api.vivo.com/sms", ativo: true },
  { id: 2, nome: "Claro", endpointSms: "https://api.claro.com/sms", ativo: false },
  { id: 3, nome: "TIM", endpointSms: "https://api.tim.com/sms", ativo: false },
];

const initialUsuarios: Usuario[] = [
  { id: 1, username: "admin", email: "admin@submarine.com", ativo: true },
  { id: 2, username: "operador", email: "operador@submarine.com", ativo: true },
];

function useEntityState<T extends { id: number }>(initial: T[]) {
  const [items, setItems] = useState<T[]>(initial);
  const nextId = () => Math.max(0, ...items.map((i) => i.id)) + 1;

  const add = (item: Omit<T, "id">) => {
    setItems((prev) => [...prev, { ...item, id: nextId() } as T]);
  };

  const update = (id: number, data: Partial<T>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, add, update, remove, setItems };
}

export function useMockData() {
  const clientes = useEntityState<Cliente>(initialClientes);
  const campanhas = useEntityState<Campanha>(initialCampanhas);
  const operadoras = useEntityState<Operadora>(initialOperadoras);
  const usuarios = useEntityState<Usuario>(initialUsuarios);

  return { clientes, campanhas, operadoras, usuarios };
}

export type MockData = ReturnType<typeof useMockData>;
