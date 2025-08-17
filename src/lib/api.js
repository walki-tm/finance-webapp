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

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return txt; }
  }

  return res.json();
}

export const api = {
  // ---- Auth ----
  register: (name, email, password) =>
    request("/api/auth/register", "POST", null, { name, email, password }),
  login: (email, password) =>
    request("/api/auth/login", "POST", null, { email, password }),

  // ---- Categories ----
  listCategories: (token) =>
    request("/api/categories", "GET", token),
  addCategory: (token, data) =>
    request("/api/categories", "POST", token, data),
  updateCategory: (token, id, data) =>
    request(`/api/categories/${id}`, "PUT", token, data),
  deleteCategory: (token, id) =>
    request(`/api/categories/${id}`, "DELETE", token),

  addSubCategory: (token, data) =>
    request("/api/categories/sub", "POST", token, data),
  updateSubCategory: (token, id, data) =>
    request(`/api/categories/sub/${id}`, "PUT", token, data),
  deleteSubCategory: (token, id) =>
    request(`/api/categories/sub/${id}`, "DELETE", token),

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
