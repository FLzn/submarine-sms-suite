const BASE_URL = import.meta.env.VITE_API_URL;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

function authHeaders(token: string): Record<string, string> {
  return { ...defaultHeaders, Authorization: `Bearer ${token}` };
}

function getToken(): string {
  const token = localStorage.getItem("submarine_token");
  if (!token) throw new Error("Não autenticado");
  return token;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Erro ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ─── Auth ───────────────────────────────────────────
export async function apiLogin(email: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// ─── Generic CRUD ───────────────────────────────────
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders(getToken()) });
  return handleResponse(res);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(getToken()),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(getToken()),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(getToken()),
  });
  return handleResponse(res);
}

// ─── Types (matching backend) ───────────────────────
export interface ApiCliente {
  id: number;
  cnpj_cpf: string;
  nome: string;
  code?: number;
  status: "on" | "off";
}

export interface ApiCampanha {
  id: number;
  cliente_id: number;
  descricao: string;
  valor_sms: string;
  token: string;
  status: "on" | "off";
}

export interface ApiOperadora {
  id: number;
  nome: string;
  endpoint_sms: string;
  status: "on" | "off";
}

export interface ApiUsuario {
  id: number;
  username: string;
  email: string;
  password?: string;
  status: "on" | "off";
}

export interface ApiSmsLog {
  id: number;
  campanha_id: number;
  campanha: {
    id: number;
    descricao: string;
    cliente: {
      id: number;
      nome: string;
    };
  };
  phone_number: string;
  message: string;
  status: number;
  status_description: string;
  pontal_id: string;
  sent_at: string;
}

// ─── Clientes ───────────────────────────────────────
export const clientesApi = {
  list: () => get<ApiCliente[]>("/clientes"),
  get: (id: number) => get<ApiCliente>(`/clientes/${id}`),
  create: (data: Omit<ApiCliente, "id">) => post<ApiCliente>("/clientes", data),
  update: (id: number, data: Partial<ApiCliente>) => put<ApiCliente>(`/clientes/${id}`, data),
  delete: (id: number) => del(`/clientes/${id}`),
};

// ─── Campanhas ──────────────────────────────────────
export const campanhasApi = {
  list: () => get<ApiCampanha[]>("/campanhas"),
  get: (id: number) => get<ApiCampanha>(`/campanhas/${id}`),
  create: (data: Omit<ApiCampanha, "id">) => post<ApiCampanha>("/campanhas", data),
  update: (id: number, data: Partial<ApiCampanha>) => put<ApiCampanha>(`/campanhas/${id}`, data),
  delete: (id: number) => del(`/campanhas/${id}`),
};

// ─── Operadoras ─────────────────────────────────────
export const operadorasApi = {
  list: () => get<ApiOperadora[]>("/operadoras"),
  get: (id: number) => get<ApiOperadora>(`/operadoras/${id}`),
  create: (data: Omit<ApiOperadora, "id">) => post<ApiOperadora>("/operadoras", data),
  update: (id: number, data: Partial<ApiOperadora>) => put<ApiOperadora>(`/operadoras/${id}`, data),
  delete: (id: number) => del(`/operadoras/${id}`),
};

// ─── Usuários ───────────────────────────────────────
export const usuariosApi = {
  list: () => get<ApiUsuario[]>("/users"),
  get: (id: number) => get<ApiUsuario>(`/users/${id}`),
  create: (data: { username: string; email: string; password: string; status: "on" | "off" }) =>
    post<ApiUsuario>("/users", data),
  update: (id: number, data: Partial<ApiUsuario>) => put<ApiUsuario>(`/users/${id}`, data),
  delete: (id: number) => del(`/users/${id}`),
};

// ─── SMS Replies ────────────────────────────────────
export interface ApiSmsReply {
  id: number;
  sms_log_id: number | null;
  message_id: string;
  from_number: string;
  message: string;
  classify: string;
  value: string;
  received_at: string;
  created_at: string;
  sms_log?: {
    message: string;
    phone_number: string;
    campanha?: {
      descricao: string;
      cliente?: { nome: string };
    };
  } | null;
}

export interface SmsReplyFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const smsRepliesApi = {
  list: (filters?: SmsReplyFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));
    const query = params.toString();
    return get<PaginatedResponse<ApiSmsReply>>(`/sms-replies${query ? `?${query}` : ""}`);
  },
};

// ─── Preferências ───────────────────────────────────
export interface ApiPreferencias {
  id: number;
  cleanup_enabled: boolean;
  cleanup_interval_months: number;
  updated_at: string;
}

export const preferenciasApi = {
  get: () => get<ApiPreferencias>("/preferencias"),
  update: (data: Partial<Pick<ApiPreferencias, "cleanup_enabled" | "cleanup_interval_months">>) =>
    put<ApiPreferencias>("/preferencias", data),
};

// ─── SMS Logs ───────────────────────────────────────
export interface SmsLogFilters {
  startDate?: string;
  endDate?: string;
  campanhaId?: number;
  clienteId?: number;
  campanhaName?: string;
  clienteName?: string;
  status?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SmsStats {
  total: number;
  total_delivered: number;
  total_pending: number;
  total_error: number;
  valor_total: number;
  total_replies: number;
  valor_total_replies: number;
}

export const smsLogsApi = {
  list: (filters?: SmsLogFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.campanhaId) params.set("campanhaId", String(filters.campanhaId));
    if (filters?.clienteId) params.set("clienteId", String(filters.clienteId));
    if (filters?.campanhaName) params.set("campanhaName", filters.campanhaName);
    if (filters?.clienteName) params.set("clienteName", filters.clienteName);
    if (filters?.status !== undefined) params.set("status", String(filters.status));
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));
    const query = params.toString();
    return get<PaginatedResponse<ApiSmsLog>>(`/sms-logs${query ? `?${query}` : ""}`);
  },
  stats: (filters?: Omit<SmsLogFilters, "status" | "page" | "limit">) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.campanhaId) params.set("campanhaId", String(filters.campanhaId));
    if (filters?.clienteId) params.set("clienteId", String(filters.clienteId));
    if (filters?.campanhaName) params.set("campanhaName", filters.campanhaName);
    if (filters?.clienteName) params.set("clienteName", filters.clienteName);
    const query = params.toString();
    return get<SmsStats>(`/sms-logs/stats${query ? `?${query}` : ""}`);
  },
};

// ─── Relatórios ─────────────────────────────────────
export interface RelatorioTotais {
  total: number;
  total_delivered: number;
  total_pending: number;
  total_error: number;
  valor_total: number;
  taxa_entrega: number;
}

export interface RelatorioPorCliente {
  cliente_id: number;
  cliente_nome: string;
  total: number;
  total_delivered: number;
  total_pending: number;
  total_error: number;
  valor_total: number;
  taxa_entrega: number;
}

export interface RelatorioEvolucaoDiaria {
  data: string;
  total: number;
  total_delivered: number;
  total_error: number;
}

export interface RelatorioSms {
  periodo: { start: string; end: string };
  totais: RelatorioTotais;
  por_cliente: RelatorioPorCliente[];
  evolucao_diaria: RelatorioEvolucaoDiaria[];
}

export const relatoriosApi = {
  get: (startDate: string, endDate: string) =>
    get<RelatorioSms>(`/relatorios/sms?startDate=${startDate}&endDate=${endDate}`),
  downloadPdf: async (startDate: string, endDate: string) => {
    const token = getToken();
    const res = await fetch(
      `${BASE_URL}/relatorios/sms/pdf?startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeaders(token) }
    );
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-sms-${startDate}-${endDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
