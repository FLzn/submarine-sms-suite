import { test, expect, APIRequestContext } from "@playwright/test";
import { format, subDays } from "date-fns";

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.VITE_API_URL!;
const TEST_EMAIL = process.env.TEST_EMAIL!;
const TEST_PASSWORD = process.env.TEST_PASSWORD!;

const JSON_HEADERS = { "Content-Type": "application/json" };

function authHeaders(token: string) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    headers: JSON_HEADERS,
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  expect(res.ok(), "Login falhou — verifique TEST_EMAIL e TEST_PASSWORD no .env").toBe(true);
  const body = await res.json();
  expect(body).toHaveProperty("access_token");
  return body.access_token;
}

// Datas para relatórios
const today = format(new Date(), "yyyy-MM-dd");
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

// ─── Auth ────────────────────────────────────────────────────────────────────

test.describe("Auth", () => {
  test("POST /auth/login — credenciais inválidas retorna 401", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      headers: JSON_HEADERS,
      data: { email: "invalido@teste.com", password: "senhaerrada" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /auth/login — credenciais válidas retorna access_token", async ({ request }) => {
    const token = await login(request);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
  });
});

// ─── Clientes ────────────────────────────────────────────────────────────────

test.describe("Clientes", () => {
  let token: string;
  let clienteId: number;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test.afterAll(async ({ request }) => {
    if (clienteId) {
      await request.delete(`${BASE_URL}/clientes/${clienteId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("GET /clientes — retorna array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/clientes`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /clientes — cria registro", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/clientes`, {
      headers: authHeaders(token),
      data: {
        cnpj_cpf: "00.000.000/0001-00",
        nome: "__TESTE_PLAYWRIGHT__",
        code: 99999,
        status: "on",
      },
    });
    expect(res.ok(), `POST /clientes retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.nome).toBe("__TESTE_PLAYWRIGHT__");
    clienteId = body.id;
  });

  test("GET /clientes/:id — retorna o registro criado", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/clientes/${clienteId}`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(clienteId);
  });

  test("PUT /clientes/:id — atualiza registro", async ({ request }) => {
    const res = await request.put(`${BASE_URL}/clientes/${clienteId}`, {
      headers: authHeaders(token),
      data: { nome: "__TESTE_PLAYWRIGHT_EDITADO__", status: "off" },
    });
    expect(res.ok(), `PUT /clientes/${clienteId} retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body.nome).toBe("__TESTE_PLAYWRIGHT_EDITADO__");
  });

  test("DELETE /clientes/:id — remove registro", async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/clientes/${clienteId}`, {
      headers: authHeaders(token),
    });
    expect(res.ok(), `DELETE /clientes/${clienteId} retornou ${res.status()}`).toBe(true);
    clienteId = 0; // evita duplo delete no afterAll
  });
});

// ─── Campanhas ───────────────────────────────────────────────────────────────

test.describe("Campanhas", () => {
  let token: string;
  let clienteId: number;
  let campanhaId: number;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
    // Cria um cliente de suporte para o teste
    const res = await request.post(`${BASE_URL}/clientes`, {
      headers: authHeaders(token),
      data: { cnpj_cpf: "11.111.111/0001-11", nome: "__TESTE_PW_CLIENTE_CAMP__", code: 99998, status: "on" },
    });
    const body = await res.json();
    clienteId = body.id;
  });

  test.afterAll(async ({ request }) => {
    if (campanhaId) {
      await request.delete(`${BASE_URL}/campanhas/${campanhaId}`, {
        headers: authHeaders(token),
      });
    }
    if (clienteId) {
      await request.delete(`${BASE_URL}/clientes/${clienteId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("GET /campanhas — retorna array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/campanhas`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("POST /campanhas — cria registro", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/campanhas`, {
      headers: authHeaders(token),
      data: {
        cliente_id: clienteId,
        descricao: "__TESTE_PLAYWRIGHT__",
        valor_sms: 0.01,
        token: `pw-test-token-${Date.now()}`,
        status: "on",
      },
    });
    expect(res.ok(), `POST /campanhas retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    campanhaId = body.id;
  });

  test("GET /campanhas/:id — retorna o registro criado", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/campanhas/${campanhaId}`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(campanhaId);
  });

  test("PUT /campanhas/:id — atualiza registro", async ({ request }) => {
    const res = await request.put(`${BASE_URL}/campanhas/${campanhaId}`, {
      headers: authHeaders(token),
      data: { descricao: "__TESTE_PLAYWRIGHT_EDITADO__", status: "off" },
    });
    expect(res.ok(), `PUT /campanhas/${campanhaId} retornou ${res.status()}`).toBe(true);
  });

  test("DELETE /campanhas/:id — remove registro", async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/campanhas/${campanhaId}`, {
      headers: authHeaders(token),
    });
    expect(res.ok(), `DELETE /campanhas/${campanhaId} retornou ${res.status()}`).toBe(true);
    campanhaId = 0;
  });
});

// ─── Operadoras ──────────────────────────────────────────────────────────────

test.describe("Operadoras", () => {
  let token: string;
  let operadoraId: number;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test.afterAll(async ({ request }) => {
    if (operadoraId) {
      await request.delete(`${BASE_URL}/operadoras/${operadoraId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("GET /operadoras — retorna array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/operadoras`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("POST /operadoras — cria registro", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/operadoras`, {
      headers: authHeaders(token),
      data: {
        nome: "__TESTE_PLAYWRIGHT__",
        endpoint_sms: "https://teste.endpoint.com/sms",
        status: "on",
      },
    });
    expect(res.ok(), `POST /operadoras retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    operadoraId = body.id;
  });

  test("GET /operadoras/:id — retorna o registro criado", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/operadoras/${operadoraId}`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
  });

  test("PUT /operadoras/:id — atualiza registro", async ({ request }) => {
    const res = await request.put(`${BASE_URL}/operadoras/${operadoraId}`, {
      headers: authHeaders(token),
      data: { nome: "__TESTE_PLAYWRIGHT_EDITADO__", status: "off" },
    });
    expect(res.ok(), `PUT /operadoras/${operadoraId} retornou ${res.status()}`).toBe(true);
  });

  test("DELETE /operadoras/:id — remove registro", async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/operadoras/${operadoraId}`, {
      headers: authHeaders(token),
    });
    expect(res.ok(), `DELETE /operadoras/${operadoraId} retornou ${res.status()}`).toBe(true);
    operadoraId = 0;
  });
});

// ─── Usuários ────────────────────────────────────────────────────────────────

test.describe("Usuários", () => {
  let token: string;
  let usuarioId: number;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test.afterAll(async ({ request }) => {
    if (usuarioId) {
      await request.delete(`${BASE_URL}/users/${usuarioId}`, {
        headers: authHeaders(token),
      });
    }
  });

  test("GET /users — retorna array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/users`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("POST /users — cria registro", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/users`, {
      headers: authHeaders(token),
      data: {
        username: `pw_teste_${Date.now()}`,
        email: `pw_teste_${Date.now()}@teste.com`,
        password: "Senha@123",
        status: "on",
      },
    });
    expect(res.ok(), `POST /users retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    usuarioId = body.id;
  });

  test("GET /users/:id — retorna o registro criado", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/users/${usuarioId}`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
  });

  test("PUT /users/:id — atualiza registro", async ({ request }) => {
    const res = await request.put(`${BASE_URL}/users/${usuarioId}`, {
      headers: authHeaders(token),
      data: { status: "off" },
    });
    expect(res.ok(), `PUT /users/${usuarioId} retornou ${res.status()}`).toBe(true);
  });

  test("DELETE /users/:id — remove registro", async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/users/${usuarioId}`, {
      headers: authHeaders(token),
    });
    expect(res.ok(), `DELETE /users/${usuarioId} retornou ${res.status()}`).toBe(true);
    usuarioId = 0;
  });
});

// ─── SMS Logs ────────────────────────────────────────────────────────────────

test.describe("SMS Logs", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test("GET /sms-logs — retorna resposta paginada", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/sms-logs?startDate=${thirtyDaysAgo}&endDate=${today}&page=1&limit=10`,
      { headers: authHeaders(token) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("pages");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /sms-logs/stats — retorna totalizadores", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/sms-logs/stats?startDate=${thirtyDaysAgo}&endDate=${today}`,
      { headers: authHeaders(token) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("total_delivered");
    expect(body).toHaveProperty("total_pending");
    expect(body).toHaveProperty("total_error");
    expect(body).toHaveProperty("valor_total");
  });

  test("GET /sms-logs — sem autenticação retorna 401", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sms-logs`, {
      headers: JSON_HEADERS,
    });
    expect(res.status()).toBe(401);
  });
});

// ─── SMS Replies ─────────────────────────────────────────────────────────────

test.describe("SMS Replies", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test("GET /sms-replies — retorna resposta paginada", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/sms-replies?startDate=${thirtyDaysAgo}&endDate=${today}&page=1&limit=10`,
      { headers: authHeaders(token) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ─── Preferências ────────────────────────────────────────────────────────────

test.describe("Preferências", () => {
  let token: string;
  let originalPrefs: { cleanup_enabled: boolean; cleanup_interval_months: number };

  test.beforeAll(async ({ request }) => {
    token = await login(request);
    // Salva estado original para restaurar ao final
    const res = await request.get(`${BASE_URL}/preferencias`, {
      headers: authHeaders(token),
    });
    originalPrefs = await res.json();
  });

  test.afterAll(async ({ request }) => {
    // Restaura as preferências originais
    if (originalPrefs) {
      await request.put(`${BASE_URL}/preferencias`, {
        headers: authHeaders(token),
        data: {
          cleanup_enabled: originalPrefs.cleanup_enabled,
          cleanup_interval_months: originalPrefs.cleanup_interval_months,
        },
      });
    }
  });

  test("GET /preferencias — retorna configurações", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/preferencias`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("cleanup_enabled");
    expect(body).toHaveProperty("cleanup_interval_months");
  });

  test("PUT /preferencias — atualiza configurações", async ({ request }) => {
    const res = await request.put(`${BASE_URL}/preferencias`, {
      headers: authHeaders(token),
      data: { cleanup_enabled: false, cleanup_interval_months: 6 },
    });
    expect(res.ok(), `PUT /preferencias retornou ${res.status()}`).toBe(true);
    const body = await res.json();
    expect(body.cleanup_enabled).toBe(false);
    expect(body.cleanup_interval_months).toBe(6);
  });
});

// ─── Relatórios ──────────────────────────────────────────────────────────────

test.describe("Relatórios", () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test("GET /relatorios/sms — retorna estrutura completa", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/relatorios/sms?startDate=${thirtyDaysAgo}&endDate=${today}`,
      { headers: authHeaders(token) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("periodo");
    expect(body).toHaveProperty("totais");
    expect(body).toHaveProperty("por_cliente");
    expect(body).toHaveProperty("evolucao_diaria");
    expect(Array.isArray(body.por_cliente)).toBe(true);
    expect(Array.isArray(body.evolucao_diaria)).toBe(true);
  });

  test("GET /relatorios/sms/pdf — retorna PDF", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/relatorios/sms/pdf?startDate=${thirtyDaysAgo}&endDate=${today}`,
      { headers: authHeaders(token) }
    );
    expect(res.ok(), `GET /relatorios/sms/pdf retornou ${res.status()}`).toBe(true);
    expect(res.headers()["content-type"]).toContain("pdf");
  });
});
