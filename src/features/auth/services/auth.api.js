// Servizi Auth: wrapper su lib/api
import { api } from '../../lib/api.js'

export const authService = {
  register: (name, email, password) => api.register(name, email, password),
  login: (email, password) => api.login(email, password),
}

