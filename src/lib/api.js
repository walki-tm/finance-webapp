/**
 * Client leggero per l'interfaccia verso il backend dell'applicazione.
 * Espone helper che incapsulano le richieste HTTP per operazioni di
 * autenticazione, categorie e transazioni.
 *
 * @constant {string} API_URL Base delle chiamate API, letta da `VITE_API_URL`.
 */
const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, method = "GET", token, body) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Imposta il Content-Type SOLO se invii un body
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
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
  /**
   * Registra un nuovo utente.
   * @param {string} name Nome completo.
   * @param {string} email Indirizzo email.
   * @param {string} password Password dell'utente.
   * @returns {Promise<object>} Dati dell'utente o token di autenticazione.
   * @throws {Error} Se la richiesta fallisce.
   */
  register: (name, email, password) =>
    request("/api/auth/register", "POST", null, { name, email, password }),
  /**
   * Effettua il login dell'utente.
   * @param {string} email Indirizzo email.
   * @param {string} password Password dell'utente.
   * @returns {Promise<object>} Token e dati di sessione.
   * @throws {Error} Se la richiesta fallisce.
   */
  login: (email, password) =>
    request("/api/auth/login", "POST", null, { email, password }),

  // ---- Categories ----
  /**
   * Restituisce l'elenco delle categorie.
   * @param {string} token Token di accesso JWT.
   * @returns {Promise<Array>} Array di categorie.
   * @throws {Error} Se la richiesta fallisce.
   */
  listCategories: (token) =>
    request("/api/categories", "GET", token),
  /**
   * Aggiunge una nuova categoria.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dati della categoria da creare.
   * @returns {Promise<object>} Categoria creata.
   * @throws {Error} Se la richiesta fallisce.
   */
  addCategory: (token, data) =>
    request("/api/categories", "POST", token, data),
  /**
   * Aggiorna una categoria esistente.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della categoria.
   * @param {object} data Dati aggiornati.
   * @returns {Promise<object>} Categoria aggiornata.
   * @throws {Error} Se la richiesta fallisce.
   */
  updateCategory: (token, id, data) =>
    request(`/api/categories/${id}`, "PUT", token, data),
  /**
   * Elimina una categoria.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della categoria.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteCategory: (token, id) =>
    request(`/api/categories/${id}`, "DELETE", token),

  /**
   * Aggiunge una sottocategoria.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dati della sottocategoria.
   * @returns {Promise<object>} Sottocategoria creata.
   * @throws {Error} Se la richiesta fallisce.
   */
  addSubCategory: (token, data) =>
    request("/api/categories/sub", "POST", token, data),
  /**
   * Aggiorna una sottocategoria.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della sottocategoria.
   * @param {object} data Dati aggiornati.
   * @returns {Promise<object>} Sottocategoria aggiornata.
   * @throws {Error} Se la richiesta fallisce.
   */
  updateSubCategory: (token, id, data) =>
    request(`/api/categories/sub/${id}`, "PUT", token, data),
  /**
   * Elimina una sottocategoria.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della sottocategoria.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteSubCategory: (token, id) =>
    request(`/api/categories/sub/${id}`, "DELETE", token),

  // ---- Transactions ----
  /**
   * Elenca le transazioni di un dato mese e anno.
   * @param {string} token Token di accesso JWT.
   * @param {number} year Anno di riferimento.
   * @param {number} month Mese di riferimento (1-12).
   * @returns {Promise<Array>} Lista di transazioni.
   * @throws {Error} Se la richiesta fallisce.
   */
  listTransactions: (token, year, month) =>
    request(`/api/transactions?year=${year}&month=${month}`, "GET", token),
  /**
   * Crea una nuova transazione.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dettagli della transazione.
   * @returns {Promise<object>} Transazione creata.
   * @throws {Error} Se la richiesta fallisce.
   */
  addTransaction: (token, data) =>
    request("/api/transactions", "POST", token, data),
  /**
   * Aggiorna una transazione esistente.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della transazione.
   * @param {object} data Dati aggiornati.
   * @returns {Promise<object>} Transazione aggiornata.
   * @throws {Error} Se la richiesta fallisce.
   */
  updateTransaction: (token, id, data) =>
    request(`/api/transactions/${id}`, "PUT", token, data),
  /**
   * Elimina una transazione.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della transazione.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteTransaction: (token, id) =>
    request(`/api/transactions/${id}`, "DELETE", token),
};
