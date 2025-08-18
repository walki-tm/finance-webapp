// routes/categories.js
import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  listCategories,
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
} from '../controllers/categoriesController.js'

const router = Router()
router.use(authRequired)

router.get('/', listCategories)
router.post('/', createCategory)
router.put('/:id', updateCategory)
router.post('/sub', createSubcategory)
router.put('/sub/:id', updateSubcategory)
router.delete('/:id', deleteCategory)
router.delete('/sub/:id', deleteSubcategory)

export default router
