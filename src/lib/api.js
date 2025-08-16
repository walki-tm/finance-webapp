// src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, method = "GET", token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Se non ok, prova a leggere JSON o testo per messaggio errore
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = await res.json();
      msg = err?.error || msg;
    } catch {
      try {
        const txt = await res.text();
        if (txt) msg = txt;
      } catch {}
    }
    throw new Error(msg);
  }

  // DELETE (204) o qualsiasi 204 → niente body
  if (res.status === 204) return null;

  // Alcuni endpoint potrebbero non ritornare JSON
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return txt; }
  }

  return res.json();
}

// ---- Auth ----
export const api = {
  register: (email, password) =>
    request("/api/auth/register", "POST", null, { email, password }),
  login: (email, password) =>
    request("/api/auth/login", "POST", null, { email, password }),

  // ---- Categories ----
  listCategories: (token) =>
    request("/api/categories", "GET", token),
  addCategory: (token, data) =>
    request("/api/categories", "POST", token, data),
  addSubCategory: (token, data) =>
    request("/api/categories/sub", "POST", token, data),

  // ---- Transactions ----
  listTransactions: (token, year, month) =>
    request(`/api/transactions?year=${year}&month=${month}`, "GET", token),
  addTransaction: (token, data) =>
    request("/api/transactions", "POST", token, data),
  updateTransaction: (token, id, data) =>
    request(`/api/transactions/${id}`, "PUT", token, data),
  deleteTransaction: (token, id) =>
    request(`/api/transactions/${id}`, "DELETE", token),
};
