import { useState, useCallback, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Normalize main category keys to handle plural/singular inconsistencies
const normalizeMainKey = (main) => {
  const u = String(main || 'expense').toUpperCase();
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' };
  return map[u] || u.toLowerCase();
};

export default function useBudgets(year, initial = {}) {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState(initial);
  const [budgetMeta, setBudgetMeta] = useState({}); // stores managedAutomatically and other metadata
  const [subcatsMap, setSubcatsMap] = useState({}); // maps subName -> subcategoryId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load budgets and build subcategories mapping from backend
  useEffect(() => {
    if (!token || !year) {
      // Fallback to initial empty state if no token
      const safeYear = year || new Date().getFullYear().toString();
      setBudgets({ [safeYear]: {} });
      return;
    }
    
    const loadBudgets = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load budgets from API
        const budgetList = await api.listBudgets(token, parseInt(year, 10));
        
        // Load categories to build subcategory mapping
        const categories = await api.listCategories(token);
        
        // Build subcategory name -> id mapping with normalization
        const subcatsMapping = {};
        const mainKeyMapping = {}; // maps normalized key to original DB key
        categories.forEach(cat => {
          const dbMainKey = cat.main.toLowerCase(); // from database
          const normalizedMainKey = normalizeMainKey(cat.main); // normalized for frontend
          
          // Store mapping from normalized to original for API calls
          mainKeyMapping[normalizedMainKey] = cat.main.toUpperCase();
          
          (cat.subcats || []).forEach(sub => {
            // Map both the database key and normalized key to support lookups
            subcatsMapping[`${dbMainKey}:${sub.name}`] = sub.id;
            subcatsMapping[`${normalizedMainKey}:${sub.name}`] = sub.id;
          });
        });
        // Store both the mapping and the main key mapping
        subcatsMapping.__mainKeyMapping = mainKeyMapping;
        setSubcatsMap(subcatsMapping);
        
        // Convert budget list to legacy format: {year: {"main:sub:month": value}}
        // Also store metadata separately
        const converted = { [year]: {} };
        const metadata = { [year]: {} };
        if (Array.isArray(budgetList)) {
          budgetList.forEach(budget => {
            const dbMainKey = budget.main.toLowerCase(); // from database
            const normalizedMainKey = normalizeMainKey(budget.main); // normalized for frontend
            const period = budget.period; // YYYY-MM format
            const monthIndex = parseInt(period.split('-')[1], 10) - 1; // 0-11
            
            if (budget.subcategory) {
              // Use normalized key for consistency with frontend
              const key = `${normalizedMainKey}:${budget.subcategory.name}:${monthIndex}`;
              converted[year][key] = parseFloat(budget.amount);
              
              // Store metadata including managedAutomatically
              metadata[year][key] = {
                managedAutomatically: budget.managedAutomatically || false,
                style: budget.style,
                notes: budget.notes,
                createdAt: budget.createdAt,
                updatedAt: budget.updatedAt
              };
            }
          });
        }
        
        setBudgets(converted);
        setBudgetMeta(metadata);
      } catch (err) {
        console.error('Error loading budgets:', err);
        setError(err);
        // Fallback to empty state on error
        setBudgets({ [year]: {} });
      } finally {
        setLoading(false);
      }
    };
    
    loadBudgets();
  }, [token, year]);

  const upsertBudget = useCallback(async (main, keyWithMonth, value) => {
    if (!token) return;
    
    // Parse key format: "subname:monthIndex"
    const [subName, monthIndexStr] = keyWithMonth.split(':');
    const monthIndex = parseInt(monthIndexStr, 10);
    const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    // Get subcategory ID from mapping
    const subcategoryKey = `${main.toLowerCase()}:${subName}`;
    const subcategoryId = subcatsMap[subcategoryKey];
    if (!subcategoryId) {
      console.error('Subcategory not found:', subcategoryKey);
      console.log('Available subcategory keys:', Object.keys(subcatsMap));
      console.log('Request details:', { main, subName, monthIndex, period });
      return;
    }
    
    // Get the original database main key
    const mainKeyMapping = subcatsMap.__mainKeyMapping || {};
    const originalMainKey = mainKeyMapping[main] || main.toUpperCase();
    
    console.log('Upsert mapping:', { 
      normalizedMain: main, 
      originalMain: originalMainKey, 
      subcategoryKey, 
      subcategoryId 
    });
    
    try {
      // Call API to upsert budget with original database main key
      await api.upsertBudget(token, {
        main: originalMainKey,
        subcategoryId,
        period,
        amount: parseFloat(value) || 0,
        style: 'FIXED'
      });
      
      // Optimistic update to local state
      const legacyKey = `${main}:${keyWithMonth}`;
      setBudgets(b => ({
        ...b,
        [year]: { ...(b[year] || {}), [legacyKey]: parseFloat(value) || 0 },
      }));
      
    } catch (err) {
      console.error('Error upserting budget:', err);
      throw err;
    }
  }, [year, token, subcatsMap]);

  // Batch upsert function for efficiency
  const batchUpsertBudgets = useCallback(async (budgetUpdates) => {
    if (!token || !budgetUpdates.length) return;
    
    const mainKeyMapping = subcatsMap.__mainKeyMapping || {};
    
    const apiUpdates = budgetUpdates.map(({ main, keyWithMonth, value, managedAutomatically = false }) => {
      const [subName, monthIndexStr] = keyWithMonth.split(':');
      const monthIndex = parseInt(monthIndexStr, 10);
      const period = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const subcategoryKey = `${main.toLowerCase()}:${subName}`;
      const subcategoryId = subcatsMap[subcategoryKey];
      
      // Get the original database main key
      const originalMainKey = mainKeyMapping[main] || main.toUpperCase();
      
      // Debug logging
      if (!subcategoryId) {
        console.warn(`Subcategory not found for: ${subcategoryKey}`);
        console.log('Available subcategory keys:', Object.keys(subcatsMap));
      }
      
      return {
        main: originalMainKey,
        subcategoryId,
        period,
        amount: parseFloat(value) || 0,
        style: 'FIXED',
        managedAutomatically,
        originalKey: subcategoryKey // for debugging
      };
    });
    
    const validUpdates = apiUpdates.filter(update => update.subcategoryId);
    const invalidUpdates = apiUpdates.filter(update => !update.subcategoryId);
    
    if (invalidUpdates.length > 0) {
      console.error('Invalid subcategory mappings found:', invalidUpdates);
    }
    
    if (validUpdates.length === 0) {
      console.error('No valid budget updates found!');
      throw new Error('Nessuna sottocategoria valida trovata per questo aggiornamento');
    }
    
    try {
      await api.batchUpsertBudgets(token, validUpdates);
      
      // Optimistic update to local state - only for successful updates
      const updates = {};
      const metaUpdates = {};
      budgetUpdates.forEach(({ main, keyWithMonth, value, managedAutomatically = false }) => {
        const [subName] = keyWithMonth.split(':');
        const subcategoryKey = `${main.toLowerCase()}:${subName}`;
        // Only update local state if the subcategory was found
        if (subcatsMap[subcategoryKey]) {
          const legacyKey = `${main}:${keyWithMonth}`;
          updates[legacyKey] = parseFloat(value) || 0;
          
          // Update metadata
          metaUpdates[legacyKey] = {
            ...budgetMeta[year]?.[legacyKey],
            managedAutomatically,
            updatedAt: new Date().toISOString()
          };
        }
      });
      
      setBudgets(b => ({
        ...b,
        [year]: { ...(b[year] || {}), ...updates },
      }));
      
      // Update metadata
      setBudgetMeta(m => ({
        ...m,
        [year]: { ...(m[year] || {}), ...metaUpdates }
      }));
      
    } catch (err) {
      console.error('Error batch upserting budgets:', err);
      throw err;
    }
  }, [year, token, subcatsMap, budgetMeta]);

  // Funzione per refresh manuale dei budgets
  const refreshBudgets = useCallback(async () => {
    if (!token || !year) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ricarica budgets dal backend
      const budgetList = await api.listBudgets(token, parseInt(year, 10));
      
      // Convert budget list to legacy format: {year: {"main:sub:month": value}}
      // Also reload metadata separately
      const converted = { [year]: {} };
      const metadata = { [year]: {} };
      if (Array.isArray(budgetList)) {
        budgetList.forEach(budget => {
          const dbMainKey = budget.main.toLowerCase(); // from database
          const normalizedMainKey = normalizeMainKey(budget.main); // normalized for frontend
          const period = budget.period; // YYYY-MM format
          const monthIndex = parseInt(period.split('-')[1], 10) - 1; // 0-11
          
          if (budget.subcategory) {
            // Use normalized key for consistency with frontend
            const key = `${normalizedMainKey}:${budget.subcategory.name}:${monthIndex}`;
            converted[year][key] = parseFloat(budget.amount);
            
            // Store metadata including managedAutomatically
            metadata[year][key] = {
              managedAutomatically: budget.managedAutomatically || false,
              style: budget.style,
              notes: budget.notes,
              createdAt: budget.createdAt,
              updatedAt: budget.updatedAt
            };
          }
        });
      }
      
      setBudgets(converted);
      setBudgetMeta(metadata);
      console.log('Budgets refreshed successfully');
    } catch (err) {
      console.error('Error refreshing budgets:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, year, subcatsMap]);
  
  // Funzione helper per controllare se un budget è gestito automaticamente
  const isManagedAutomatically = useCallback((main, subName, monthIndex) => {
    const key = `${main}:${subName}:${monthIndex}`;
    return budgetMeta[year]?.[key]?.managedAutomatically || false;
  }, [budgetMeta, year]);

  return { 
    budgets, 
    budgetMeta,
    isManagedAutomatically,
    upsertBudget, 
    batchUpsertBudgets,
    refreshBudgets,
    loading,
    error
  };
}
