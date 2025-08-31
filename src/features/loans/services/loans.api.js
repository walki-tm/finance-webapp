/**
 * 📄 API SERVICE: Loans API
 * 
 * 🎯 Scopo: Gestisce tutte le chiamate HTTP per il sistema prestiti/mutui
 * seguendo il pattern consolidato del progetto.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale API prestiti
 */

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * 🔧 Helper per request HTTP
 */
async function request(path, method = "GET", token, body) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
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
      msg = err?.message || err?.error || msg;
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

  const response = await res.json();
  return response.data || response; // Supporta sia formato { data: ... } che diretto
}

export const loansApi = {
  // =============================================================================
  // 🎯 LOAN CRUD OPERATIONS
  // =============================================================================

  /**
   * 🎯 Crea nuovo prestito/mutuo
   * @param {string} token - JWT token
   * @param {Object} loanData - Dati del prestito
   * @returns {Promise<Object>} Prestito creato con piano ammortamento
   */
  createLoan: (token, loanData) =>
    request("/api/loans", "POST", token, loanData),

  /**
   * 🎯 Lista tutti i prestiti dell'utente
   * @param {string} token - JWT token
   * @returns {Promise<Object>} { loans: [...], summary: {...} }
   */
  getUserLoans: (token) =>
    request("/api/loans", "GET", token),

  /**
   * 🎯 Dettagli prestito specifico
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @returns {Promise<Object>} Prestito con statistiche e schedule completo
   */
  getLoanDetails: (token, loanId) =>
    request(`/api/loans/${loanId}`, "GET", token),

  /**
   * 🎯 Aggiorna prestito esistente
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @param {Object} updateData - Dati da aggiornare
   * @returns {Promise<Object>} Prestito aggiornato
   */
  updateLoan: (token, loanId, updateData) =>
    request(`/api/loans/${loanId}`, "PUT", token, updateData),

  /**
   * 🎯 Elimina prestito
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @returns {Promise<null>} Nessun contenuto in caso di successo
   */
  deleteLoan: (token, loanId) =>
    request(`/api/loans/${loanId}`, "DELETE", token),

  // =============================================================================
  // 🎯 LOAN PAYMENTS OPERATIONS
  // =============================================================================

  /**
   * 🎯 Piano di ammortamento completo
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @returns {Promise<Object>} { loanId, loanName, schedule, statistics }
   */
  getLoanPayments: (token, loanId) =>
    request(`/api/loans/${loanId}/payments`, "GET", token),

  /**
   * 🎯 Registra pagamento di una rata
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @param {number} paymentNumber - Numero rata
   * @param {Object} paymentData - Dati pagamento
   * @returns {Promise<Object>} Risultato con payment, loan update e recalculation
   */
  recordLoanPayment: (token, loanId, paymentNumber, paymentData) =>
    request(`/api/loans/${loanId}/payments/${paymentNumber}`, "PUT", token, paymentData),

  /**
   * 🎯 Salta la prossima rata del prestito
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @returns {Promise<Object>} Risultato con skipped payment e next payment
   */
  skipLoanPayment: (token, loanId) =>
    request(`/api/loans/${loanId}/skip-payment`, "POST", token),

  /**
   * 🎯 Paga automaticamente la prossima rata del prestito
   * (Usato per materializzare Planned Transactions)
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @returns {Promise<Object>} Risultato con payment e loan update
   */
  payNextLoan: (token, loanId) =>
    request(`/api/loans/${loanId}/pay-next`, "POST", token),

  // =============================================================================
  // 🎯 SIMULATION OPERATIONS
  // =============================================================================

  /**
   * 🎯 Simulazione estinzione anticipata
   * @param {string} token - JWT token
   * @param {string} loanId - ID del prestito
   * @param {number[]} targetMonths - Mesi da simulare (opzionale)
   * @returns {Promise<Object>} Simulazioni per mesi richiesti
   */
  simulateLoanPayoff: (token, loanId, targetMonths = []) =>
    request(`/api/loans/${loanId}/simulate-payoff`, "POST", token, { targetMonths }),

  // =============================================================================
  // 🎯 UTILITY FUNCTIONS
  // =============================================================================

  /**
   * 🎯 Validazione dati prestito lato client
   * @param {Object} loanData - Dati da validare
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validateLoanData(loanData) {
    const errors = []

    if (!loanData.name || loanData.name.trim().length === 0) {
      errors.push('Il nome del prestito è obbligatorio')
    }

    if (!loanData.lenderName || loanData.lenderName.trim().length === 0) {
      errors.push('Il nome della banca/ente è obbligatorio')
    }

    if (!loanData.principalAmount || loanData.principalAmount <= 0) {
      errors.push('L\'importo del prestito deve essere maggiore di zero')
    }

    if (loanData.principalAmount > 10000000) {
      errors.push('L\'importo del prestito è troppo elevato (max 10M)')
    }

    if (loanData.interestRate < 0 || loanData.interestRate > 100) {
      errors.push('Il tasso di interesse deve essere tra 0% e 100%')
    }

    if (!loanData.durationMonths || loanData.durationMonths < 1 || loanData.durationMonths > 600) {
      errors.push('La durata deve essere tra 1 e 600 mesi')
    }

    if (!loanData.firstPaymentDate) {
      errors.push('La data della prima rata è obbligatoria')
    } else {
      const firstDate = new Date(loanData.firstPaymentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (firstDate < today) {
        errors.push('La data della prima rata deve essere futura')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * 🎯 Calcolo rata mensile (lato client per preview)
   * @param {number} principal - Capitale
   * @param {number} annualRate - Tasso annuale (decimale)
   * @param {number} durationMonths - Durata in mesi
   * @returns {number} Rata mensile
   */
  calculateMonthlyPayment(principal, annualRate, durationMonths) {
    if (principal <= 0 || durationMonths <= 0) return 0

    if (annualRate <= 0) {
      return principal / durationMonths
    }

    const monthlyRate = annualRate / 12
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, durationMonths)
    const denominator = Math.pow(1 + monthlyRate, durationMonths) - 1

    return principal * (numerator / denominator)
  },

  /**
   * 🎯 Formattazione valuta
   * @param {number} amount - Importo
   * @param {string} currency - Valuta (default: EUR)
   * @returns {string} Importo formattato
   */
  formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0)
  },

  /**
   * 🎯 Formattazione percentuale
   * @param {number} rate - Tasso (decimale)
   * @returns {string} Percentuale formattata
   */
  formatPercentage(rate) {
    return `${((rate || 0) * 100).toFixed(2)}%`
  },

  /**
   * 🎯 Calcolo progresso prestito
   * @param {Object} loan - Dati prestito
   * @returns {Object} { percentage, paidAmount, remainingAmount }
   */
  calculateProgress(loan) {
    if (!loan) return { percentage: 0, paidAmount: 0, remainingAmount: 0 }

    const totalAmount = parseFloat(loan.principalAmount)
    const remainingAmount = parseFloat(loan.currentBalance)
    const paidAmount = totalAmount - remainingAmount
    const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

    return {
      percentage: Math.round(percentage * 100) / 100,
      paidAmount,
      remainingAmount
    }
  }
}

// Estendi l'API principale con i metodi dei prestiti
export const extendApiWithLoans = (api) => {
  return {
    ...api,
    
    // Loans methods
    createLoan: loansApi.createLoan,
    getUserLoans: loansApi.getUserLoans,
    getLoanDetails: loansApi.getLoanDetails,
    updateLoan: loansApi.updateLoan,
    deleteLoan: loansApi.deleteLoan,
    getLoanPayments: loansApi.getLoanPayments,
    recordLoanPayment: loansApi.recordLoanPayment,
    skipLoanPayment: loansApi.skipLoanPayment,
    payNextLoan: loansApi.payNextLoan,
    simulateLoanPayoff: loansApi.simulateLoanPayoff,
  }
}
