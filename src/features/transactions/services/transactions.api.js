// Servizi Transactions: wrapper su lib/api
import { api } from '../../lib/api.js'

export const transactionsService = {
  list: (token, year, month) => api.listTransactions(token, year, month),
  add: (token, data) => api.addTransaction(token, data),
  update: (token, id, data) => api.updateTransaction(token, id, data),
  remove: (token, id) => api.deleteTransaction(token, id),
}

