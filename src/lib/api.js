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
   * Riordina sottocategorie (batch)
   */
  reorderSubCategories: (token, items) =>
    request(`/api/categories/sub/reorder`, "PUT", token, { items }),
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
   * Elenca le transazioni con filtri flessibili.
   * @param {string} token Token di accesso JWT.
   * @param {object} filters Filtri: { year, month, fromDate, toDate, limit }
   * @returns {Promise<Array>} Lista di transazioni.
   * @throws {Error} Se la richiesta fallisce.
   */
  listTransactions: (token, filters = {}) => {
    const params = new URLSearchParams()
    if (filters.year) params.append('year', filters.year)
    if (filters.month) params.append('month', filters.month)
    if (filters.fromDate) params.append('fromDate', filters.fromDate)
    if (filters.toDate) params.append('toDate', filters.toDate)
    if (filters.limit) params.append('limit', filters.limit)
    
    const queryString = params.toString()
    return request(`/api/transactions${queryString ? '?' + queryString : ''}`, "GET", token)
  },
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

// ---- Balance ----
  /**
   * Recupera il saldo attuale calcolato in real-time.
   */
  getBalance: (token) => request('/api/balance', 'GET', token),

  // ---- Budgets ----
  /**
   * Elenca tutti i budget dell'utente per un anno.
   * @param {string} token Token di accesso JWT.
   * @param {number} year Anno di riferimento.
   * @returns {Promise<Array>} Lista di budget.
   * @throws {Error} Se la richiesta fallisce.
   */
  listBudgets: (token, year) =>
    request(`/api/budgets?year=${year}`, "GET", token),
  /**
   * Crea o aggiorna un budget specifico.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dettagli del budget.
   * @returns {Promise<object>} Budget creato/aggiornato.
   * @throws {Error} Se la richiesta fallisce.
   */
  upsertBudget: (token, data) =>
    request("/api/budgets", "POST", token, data),
  /**
   * Crea o aggiorna più budget in una singola operazione.
   * @param {string} token Token di accesso JWT.
   * @param {Array} budgets Array di budget da creare/aggiornare.
   * @returns {Promise<Array>} Budget creati/aggiornati.
   * @throws {Error} Se la richiesta fallisce.
   */
  batchUpsertBudgets: (token, budgets) =>
    request("/api/budgets/batch", "POST", token, { budgets }),
  /**
   * Elimina un budget.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo del budget.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteBudget: (token, id) =>
    request(`/api/budgets/${id}`, "DELETE", token),
  /**
   * Elenca budget per categoria specifica.
   * @param {string} token Token di accesso JWT.
   * @param {string} main Categoria principale.
   * @param {number} year Anno di riferimento.
   * @returns {Promise<Array>} Lista di budget per la categoria.
   * @throws {Error} Se la richiesta fallisce.
   */
  getBudgetsByCategory: (token, main, year) =>
    request(`/api/budgets/category/${main}?year=${year}`, "GET", token),

  // ---- Planned Transactions ----
  /**
   * Elenca transazioni pianificate.
   * @param {string} token Token di accesso JWT.
   * @param {object} params Parametri di filtro (es. groupId).
   * @returns {Promise<Array>} Lista di transazioni pianificate.
   * @throws {Error} Se la richiesta fallisce.
   */
  listPlannedTransactions: (token, params = {}) => {
    // Add cache buster timestamp to force fresh data
    const cacheParams = { ...params, _t: Date.now() }
    const query = new URLSearchParams(cacheParams).toString()
    const path = query ? `/api/planned-transactions?${query}` : `/api/planned-transactions?_t=${Date.now()}`
    return request(path, "GET", token)
  },
  /**
   * Crea una nuova transazione pianificata.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dettagli della transazione pianificata.
   * @returns {Promise<object>} Transazione pianificata creata.
   * @throws {Error} Se la richiesta fallisce.
   */
  addPlannedTransaction: (token, data) =>
    request("/api/planned-transactions", "POST", token, data),
  /**
   * Aggiorna una transazione pianificata esistente.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della transazione pianificata.
   * @param {object} data Dati aggiornati.
   * @returns {Promise<object>} Transazione pianificata aggiornata.
   * @throws {Error} Se la richiesta fallisce.
   */
  updatePlannedTransaction: (token, id, data) =>
    request(`/api/planned-transactions/${id}`, "PUT", token, data),
  /**
   * Elimina una transazione pianificata.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della transazione pianificata.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deletePlannedTransaction: (token, id) =>
    request(`/api/planned-transactions/${id}`, "DELETE", token),
  /**
   * Materializza una transazione pianificata in transazione reale.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo della transazione pianificata.
   * @returns {Promise<object>} Transazione creata.
   * @throws {Error} Se la richiesta fallisce.
   */
  materializePlannedTransaction: (token, id) =>
    request(`/api/planned-transactions/${id}/materialize`, "POST", token),
  /**
   * Ottiene transazioni pianificate in scadenza.
   * @param {string} token Token di accesso JWT.
   * @returns {Promise<Array>} Lista di transazioni in scadenza.
   * @throws {Error} Se la richiesta fallisce.
   */
  getPlannedTransactionsDue: (token) =>
    request("/api/planned-transactions/due", "GET", token),
  /**
   * Calcola le prossime occorrenze per una transazione pianificata.
   * @param {string} token Token di accesso JWT.
   * @param {string} startDate Data di inizio (ISO string).
   * @param {string} frequency Frequenza ('ONE_TIME', 'MONTHLY', 'YEARLY').
   * @param {number} count Numero di occorrenze da calcolare (default 5).
   * @returns {Promise<Array>} Array di date delle prossime occorrenze.
   * @throws {Error} Se la richiesta fallisce.
   */
  getNextOccurrences: (token, startDate, frequency, count = 5) => {
    const params = new URLSearchParams({ startDate, frequency, count: count.toString() })
    return request(`/api/planned-transactions/next-occurrences?${params}`, "GET", token)
  },

  // ---- Transaction Groups ----
  /**
   * Elenca gruppi di transazioni.
   * @param {string} token Token di accesso JWT.
   * @returns {Promise<Array>} Lista di gruppi.
   * @throws {Error} Se la richiesta fallisce.
   */
  listTransactionGroups: (token) =>
    request("/api/planned-transactions/groups", "GET", token),
  /**
   * Crea un nuovo gruppo di transazioni.
   * @param {string} token Token di accesso JWT.
   * @param {object} data Dati del gruppo.
   * @returns {Promise<object>} Gruppo creato.
   * @throws {Error} Se la richiesta fallisce.
   */
  addTransactionGroup: (token, data) =>
    request("/api/planned-transactions/groups", "POST", token, data),
  /**
   * Aggiorna un gruppo di transazioni.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo del gruppo.
   * @param {object} data Dati aggiornati.
   * @returns {Promise<object>} Gruppo aggiornato.
   * @throws {Error} Se la richiesta fallisce.
   */
  updateTransactionGroup: (token, id, data) =>
    request(`/api/planned-transactions/groups/${id}`, "PUT", token, data),
  /**
   * Elimina un gruppo di transazioni.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} id Identificativo del gruppo.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteTransactionGroup: (token, id) =>
    request(`/api/planned-transactions/groups/${id}`, "DELETE", token),

  // ---- Budgeting Integration ----
  /**
   * Applica una singola transazione pianificata al budgeting.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} transactionId Identificativo della transazione pianificata.
   * @param {object} options Opzioni per l'applicazione (month, year, mode).
   * @returns {Promise<object>} Risultato dell'applicazione.
   * @throws {Error} Se la richiesta fallisce.
   */
  applyTransactionToBudget: (token, transactionId, options = {}) =>
    request(`/api/planned-transactions/${transactionId}/apply-to-budget`, "POST", token, options),
  /**
   * Applica tutte le transazioni di un gruppo al budgeting.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} groupId Identificativo del gruppo.
   * @param {object} options Opzioni per l'applicazione (year, mode).
   * @returns {Promise<object>} Risultato dell'applicazione di massa.
   * @throws {Error} Se la richiesta fallisce.
   */
  applyGroupToBudget: (token, groupId, options = {}) =>
    request(`/api/planned-transactions/groups/${groupId}/apply-to-budget`, "POST", token, options),
  
  /**
   * Applica una transazione pianificata al budgeting (nuovo endpoint).
   * @param {string} token Token di accesso JWT.
   * @param {string|number} transactionId Identificativo della transazione pianificata.
   * @param {object} options Opzioni per l'applicazione (year, mode, targetMonth).
   * @returns {Promise<object>} Risultato dell'applicazione.
   * @throws {Error} Se la richiesta fallisce.
   */
  applyToBudgeting: (token, transactionId, options = {}) =>
    request(`/api/planned-transactions/${transactionId}/apply-to-budgeting`, "POST", token, options),
  
  /**
   * Rimuove una transazione pianificata dal budgeting.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} transactionId Identificativo della transazione pianificata.
   * @param {object} options Opzioni per la rimozione (year, mode, targetMonth).
   * @returns {Promise<object>} Risultato della rimozione.
   * @throws {Error} Se la richiesta fallisce.
   */
  removeFromBudgeting: (token, transactionId, options = {}) =>
    request(`/api/planned-transactions/${transactionId}/apply-to-budgeting`, "DELETE", token, options),
  
  /**
   * Attiva o disattiva una transazione pianificata.
   * @param {string} token Token di accesso JWT.
   * @param {string|number} transactionId Identificativo della transazione pianificata.
   * @param {boolean} isActive Stato desiderato (true = attiva, false = disattiva).
   * @returns {Promise<object>} Transazione aggiornata.
   * @throws {Error} Se la richiesta fallisce.
   */
  togglePlannedTransactionActive: (token, transactionId, isActive) =>
    request(`/api/planned-transactions/${transactionId}/toggle-active`, "PATCH", token, { isActive }),

  // ---- Loans ----
  /**
   * Crea un nuovo prestito/mutuo.
   * @param {string} token Token di accesso JWT.
   * @param {object} loanData Dati del prestito.
   * @returns {Promise<object>} Prestito creato con piano ammortamento.
   * @throws {Error} Se la richiesta fallisce.
   */
  createLoan: (token, loanData) =>
    request("/api/loans", "POST", token, loanData),
  /**
   * Elenca tutti i prestiti dell'utente.
   * @param {string} token Token di accesso JWT.
   * @returns {Promise<object>} { loans: [...], summary: {...} }
   * @throws {Error} Se la richiesta fallisce.
   */
  getUserLoans: (token) =>
    request("/api/loans", "GET", token),
  /**
   * Ottiene dettagli prestito specifico.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @returns {Promise<object>} Prestito con statistiche e schedule completo.
   * @throws {Error} Se la richiesta fallisce.
   */
  getLoanDetails: (token, loanId) =>
    request(`/api/loans/${loanId}`, "GET", token),
  /**
   * Aggiorna prestito esistente.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @param {object} updateData Dati da aggiornare.
   * @returns {Promise<object>} Prestito aggiornato.
   * @throws {Error} Se la richiesta fallisce.
   */
  updateLoan: (token, loanId, updateData) =>
    request(`/api/loans/${loanId}`, "PUT", token, updateData),
  /**
   * Elimina prestito.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @returns {Promise<null>} Nessun contenuto in caso di successo.
   * @throws {Error} Se la richiesta fallisce.
   */
  deleteLoan: (token, loanId) =>
    request(`/api/loans/${loanId}`, "DELETE", token),
  /**
   * Piano di ammortamento completo.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @returns {Promise<object>} { loanId, loanName, schedule, statistics }
   * @throws {Error} Se la richiesta fallisce.
   */
  getLoanPayments: (token, loanId) =>
    request(`/api/loans/${loanId}/payments`, "GET", token),
  /**
   * Registra pagamento di una rata.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @param {number} paymentNumber Numero rata.
   * @param {object} paymentData Dati pagamento.
   * @returns {Promise<object>} Risultato con payment, loan update e recalculation.
   * @throws {Error} Se la richiesta fallisce.
   */
  recordLoanPayment: (token, loanId, paymentNumber, paymentData) =>
    request(`/api/loans/${loanId}/payments/${paymentNumber}`, "PUT", token, paymentData),
  /**
   * Simulazione estinzione anticipata.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @param {number[]} targetMonths Mesi da simulare (opzionale).
   * @returns {Promise<object>} Simulazioni per mesi richiesti.
   * @throws {Error} Se la richiesta fallisce.
   */
  simulateLoanPayoff: (token, loanId, targetMonths = []) =>
    request(`/api/loans/${loanId}/simulate-payoff`, "POST", token, { targetMonths }),
  /**
   * Salta la prossima rata del prestito.
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @returns {Promise<object>} Risultato con skipped payment e next payment.
   * @throws {Error} Se la richiesta fallisce.
   */
  skipLoanPayment: (token, loanId) =>
    request(`/api/loans/${loanId}/skip-payment`, "POST", token),
  
  /**
   * Paga automaticamente la prossima rata del prestito.
   * (Usato per materializzare Planned Transactions)
   * @param {string} token Token di accesso JWT.
   * @param {string} loanId ID del prestito.
   * @returns {Promise<object>} Risultato con payment e loan update.
   * @throws {Error} Se la richiesta fallisce.
   */
  payNextLoan: (token, loanId) =>
    request(`/api/loans/${loanId}/pay-next`, "POST", token),
};
