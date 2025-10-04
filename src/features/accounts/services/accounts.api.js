/**
 * 📄 ACCOUNTS API SERVICE: Chiamate API frontend per gestione conti
 * 
 * 🎯 Scopo: Interfaccia frontend per comunicazione con backend accounts API
 * 
 * 🔧 Dipendenze principali:
 * - Fetch API per HTTP requests
 * - JWT token per autenticazione
 * 
 * 📝 Note:
 * - Gestione errori automatica
 * - Headers JWT inclusi automaticamente
 * - Parsing JSON response
 * - Supporto completo CRUD operations
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione service API accounts
 */

// 🔸 Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/**
 * 🎯 UTILITY: Crea headers per richieste API
 * 
 * @param {string} token - JWT token per autenticazione
 * @returns {Object} Headers per fetch
 */
function createHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * 🎯 UTILITY: Gestione errori API
 * 
 * @param {Response} response - Response fetch
 * @returns {Promise<Object>} Data parsed o throw error
 */
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }))
    throw new Error(errorData.error || `Errore HTTP ${response.status}`)
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return null
  }
  
  return response.json()
}

/**
 * 🎯 API: Ottieni tutti i conti dell'utente
 * 
 * @param {string} token - JWT token
 * @returns {Promise<Array>} Lista conti
 */
export async function fetchAccounts(token) {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'GET',
    headers: createHeaders(token)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Ottieni singolo conto per ID
 * 
 * @param {string} accountId - ID del conto
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Dati del conto
 */
export async function fetchAccountById(accountId, token) {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
    method: 'GET',
    headers: createHeaders(token)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Crea nuovo conto
 * 
 * @param {Object} accountData - Dati del conto
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Conto creato
 */
export async function createAccount(accountData, token) {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify(accountData)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Aggiorna conto esistente
 * 
 * @param {string} accountId - ID del conto
 * @param {Object} updateData - Dati da aggiornare
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Conto aggiornato
 */
export async function updateAccount(accountId, updateData, token) {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
    method: 'PUT',
    headers: createHeaders(token),
    body: JSON.stringify(updateData)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Elimina conto
 * 
 * @param {string} accountId - ID del conto
 * @param {string} token - JWT token
 * @returns {Promise<null>} Null se successo
 */
export async function deleteAccount(accountId, token) {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
    method: 'DELETE',
    headers: createHeaders(token)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Ottieni statistiche conti
 * 
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Statistiche aggregate
 */
export async function fetchAccountsStats(token) {
  const response = await fetch(`${API_BASE_URL}/accounts/stats`, {
    method: 'GET',
    headers: createHeaders(token)
  })
  
  return handleApiResponse(response)
}

/**
 * 🎯 API: Ricalcola balance conto
 * 
 * @param {string} accountId - ID del conto
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Conto con balance aggiornato
 */
export async function recalculateAccountBalance(accountId, token) {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/recalculate-balance`, {
    method: 'POST',
    headers: createHeaders(token)
  })
  
  return handleApiResponse(response)
}

// 🔸 Export all API functions
export default {
  fetchAccounts,
  fetchAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchAccountsStats,
  recalculateAccountBalance
}
