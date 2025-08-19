// Servizi Categories: wrapper su lib/api
import { api } from '../../lib/api.js'

export const categoriesService = {
  list: (token) => api.listCategories(token),
  add: (token, data) => api.addCategory(token, data),
  update: (token, id, data) => api.updateCategory(token, id, data),
  remove: (token, id) => api.deleteCategory(token, id),
  addSub: (token, data) => api.addSubCategory(token, data),
  updateSub: (token, id, data) => api.updateSubCategory(token, id, data),
  removeSub: (token, id) => api.deleteSubCategory(token, id),
}

