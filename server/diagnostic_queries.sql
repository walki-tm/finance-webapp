-- 🔍 DIAGNOSTIC QUERIES FOR FINANCE WEBAPP DATABASE
-- Verifica integrità dati e trova inconsistenze che potrebbero causare blocchi

-- ==========================================
-- 1. VERIFICA INTEGRITÀ REFERENZIALE
-- ==========================================

-- Transazioni con subcategorie inesistenti
SELECT 'Transazioni con subcategorie inesistenti' as issue_type, COUNT(*) as count
FROM "Transaction" t 
LEFT JOIN "Subcategory" s ON t."subId" = s."id"
WHERE t."subId" IS NOT NULL AND s."id" IS NULL;

-- Transazioni con utenti inesistenti  
SELECT 'Transazioni con utenti inesistenti' as issue_type, COUNT(*) as count
FROM "Transaction" t 
LEFT JOIN "User" u ON t."userId" = u."id"
WHERE u."id" IS NULL;

-- Subcategorie con categorie inesistenti
SELECT 'Subcategorie con categorie inesistenti' as issue_type, COUNT(*) as count
FROM "Subcategory" sc
LEFT JOIN "Category" c ON sc."categoryId" = c."id"  
WHERE c."id" IS NULL;

-- Planned transactions con subcategorie inesistenti
SELECT 'Planned transactions con subcategorie inesistenti' as issue_type, COUNT(*) as count
FROM "PlannedTransaction" pt
LEFT JOIN "Subcategory" s ON pt."subId" = s."id"
WHERE pt."subId" IS NOT NULL AND s."id" IS NULL;

-- Budget con subcategorie inesistenti
SELECT 'Budget con subcategorie inesistenti' as issue_type, COUNT(*) as count
FROM "Budget" b
LEFT JOIN "Subcategory" s ON b."subcategoryId" = s."id"
WHERE b."subcategoryId" IS NOT NULL AND s."id" IS NULL;

-- ==========================================
-- 2. VERIFICA DATI PROBLEMATICI
-- ==========================================

-- Transazioni con date future eccessive (oltre 1 anno)
SELECT 'Transazioni con date future eccessive' as issue_type, COUNT(*) as count
FROM "Transaction" 
WHERE "date" > CURRENT_DATE + INTERVAL '1 year';

-- Transazioni con importi problematici (troppo grandi o zero)
SELECT 'Transazioni con importi problematici' as issue_type, COUNT(*) as count
FROM "Transaction" 
WHERE ABS("amount") > 999999999 OR "amount" = 0;

-- Planned transactions con nextDueDate nel passato remoto
SELECT 'Planned transactions con nextDueDate nel passato remoto' as issue_type, COUNT(*) as count
FROM "PlannedTransaction" 
WHERE "nextDueDate" < CURRENT_DATE - INTERVAL '2 years' AND "isActive" = true;

-- Planned transactions con frequency invalida
SELECT 'Planned transactions con frequency invalida' as issue_type, COUNT(*) as count
FROM "PlannedTransaction" 
WHERE "frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME');

-- Budget con period formato invalido
SELECT 'Budget con period formato invalido' as issue_type, COUNT(*) as count
FROM "Budget" 
WHERE "period" !~ '^\d{4}-\d{2}$';

-- ==========================================  
-- 3. DATI DETTAGLIATI PROBLEMATICI
-- ==========================================

-- Dettagli transazioni problematiche
SELECT 'TRANSAZIONI_PROBLEMATICHE' as section, t.id, t."userId", t.date, t.amount, t.main, t."subId"
FROM "Transaction" t 
LEFT JOIN "Subcategory" s ON t."subId" = s."id"
WHERE (t."subId" IS NOT NULL AND s."id" IS NULL)
   OR ABS(t."amount") > 999999999 
   OR t."amount" = 0
   OR t."date" > CURRENT_DATE + INTERVAL '1 year'
ORDER BY t."createdAt" DESC
LIMIT 10;

-- Dettagli subcategorie problematiche  
SELECT 'SUBCATEGORIE_PROBLEMATICHE' as section, sc.id, sc."userId", sc."categoryId", sc.name
FROM "Subcategory" sc
LEFT JOIN "Category" c ON sc."categoryId" = c."id"  
WHERE c."id" IS NULL
LIMIT 10;

-- Dettagli planned transactions problematiche
SELECT 'PLANNED_TRANSACTIONS_PROBLEMATICHE' as section, pt.id, pt."userId", pt.title, pt."nextDueDate", pt."frequency", pt."isActive"
FROM "PlannedTransaction" pt
LEFT JOIN "Subcategory" s ON pt."subId" = s."id"
WHERE (pt."subId" IS NOT NULL AND s."id" IS NULL)
   OR (pt."nextDueDate" < CURRENT_DATE - INTERVAL '2 years' AND pt."isActive" = true)
   OR pt."frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME')
ORDER BY pt."createdAt" DESC  
LIMIT 10;

-- Dettagli budget problematici
SELECT 'BUDGET_PROBLEMATICI' as section, b.id, b."userId", b.main, b."subcategoryId", b."period", b.amount
FROM "Budget" b
LEFT JOIN "Subcategory" s ON b."subcategoryId" = s."id"
WHERE (b."subcategoryId" IS NOT NULL AND s."id" IS NULL)
   OR b."period" !~ '^\d{4}-\d{2}$'
   OR ABS(b."amount") > 999999999
ORDER BY b."createdAt" DESC
LIMIT 10;

-- ==========================================
-- 4. STATISTICHE GENERALI
-- ==========================================

SELECT 'STATISTICHE_GENERALI' as section, 
       'Totale Users' as metric, COUNT(*) as value FROM "User"
UNION ALL
SELECT 'STATISTICHE_GENERALI', 'Totale Categories', COUNT(*) FROM "Category"  
UNION ALL
SELECT 'STATISTICHE_GENERALI', 'Totale Subcategories', COUNT(*) FROM "Subcategory"
UNION ALL  
SELECT 'STATISTICHE_GENERALI', 'Totale Transactions', COUNT(*) FROM "Transaction"
UNION ALL
SELECT 'STATISTICHE_GENERALI', 'Totale PlannedTransactions', COUNT(*) FROM "PlannedTransaction"
UNION ALL
SELECT 'STATISTICHE_GENERALI', 'Totale Budget', COUNT(*) FROM "Budget";
