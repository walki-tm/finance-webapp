# Page ↔ Files Map

## Auth
**Frontend**
- src/features/auth/pages/Auth.jsx
- src/context/AuthContext.jsx  
**Backend**
- server/src/routes/auth.js
- server/src/controllers/authController.js
- server/src/services/authService.js

## Dashboard
**Frontend**
- src/features/dashboard/pages/Dashboard.jsx  
**Backend**
- (usa dati da /api/categories e /api/transactions)

## Budgeting
**Frontend**
- src/features/budgeting/pages/Budgeting.jsx  
**Backend**
- (nessun endpoint dedicato, logica client-side)

## Categories
**Frontend**
- src/features/categories/pages/Categories.jsx
- src/features/categories/useCategories.js  
**Backend**
- server/src/routes/categories.js
- server/src/controllers/categoriesController.js
- server/src/services/categoryService.js

## Transactions
**Frontend**
- src/features/transactions/pages/Transactions.jsx
- src/features/transactions/useTransactions.js  
**Backend**
- server/src/routes/transactions.js
- server/src/controllers/transactionsController.js
- server/src/services/transactionService.js