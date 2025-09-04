/**
 * 📄 USE FILTERED DASHBOARD DATA: Hook per dati dashboard filtrati
 * 
 * 🎯 Scopo: Centrallizza la gestione dei dati dashboard con filtri periodo/categoria
 * 
 * 🔧 Dipendenze:
 * - useTransactions per le transazioni filtrate
 * - useBalance per il saldo aggiornato
 * - Calcoli aggregati per chart e statistiche
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creato per dashboard redesign
 */

import { useMemo } from 'react'
import { useTransactions } from '../transactions/useTransactions.js'
import { useBalance } from '../app/useBalance.js'
import useBudgets from '../app/useBudgets.js'
import { MAIN_CATS } from '../../lib/constants.js'
import { parseLocalDate } from '../../lib/dateUtils.js'
import { months } from '../../lib/constants.js'

export function useFilteredDashboardData(token, filters) {
  // 🔸 Hook per transazioni filtrate
  const { 
    transactions, 
    loading: txLoading,
    refreshTransactions
  } = useTransactions(token, filters?.apiFilters)

  // 🔸 Hook per balance globale (sempre aggiornato)
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance(token)
  
  // 🔸 Hook per budgets (per calcoli progresso ring charts)
  const currentYear = new Date().getFullYear().toString()
  const { budgets, loading: budgetsLoading } = useBudgets(currentYear)

  // 🔸 Calcoli aggregati per le statistiche principali
  const aggregatedData = useMemo(() => {
    if (!transactions?.length) {
      return {
        sums: { income: 0, expense: 0, debt: 0, saving: 0 },
        categorySums: {},
        monthlyData: [],
        totalTransactions: 0
      }
    }

    // Somme per categoria main
    const sums = { income: 0, expense: 0, debt: 0, saving: 0 }
    const categorySums = {}
    
    // Filtra per categoria main se specificata
    const filteredTx = filters?.filterMain && filters.filterMain !== 'all' 
      ? transactions.filter(t => t.main === filters.filterMain)
      : transactions

    filteredTx.forEach(t => {
      const mainKey = t.main || 'expense'
      const amount = Number(t.amount || 0)
      
      // Per categorie non-income, usa valore assoluto (quanto si è speso)
      // Per income, mantieni il segno originale
      const displayAmount = mainKey === 'income' ? amount : Math.abs(amount)
      
      // Somma per categoria main
      if (sums.hasOwnProperty(mainKey)) {
        sums[mainKey] += displayAmount
      }
      
      // Somma per sottocategoria
      const subKey = `${mainKey}:${t.sub || 'altro'}`
      if (!categorySums[subKey]) categorySums[subKey] = 0
      categorySums[subKey] += displayAmount
    })

    // 🔸 Trova tutte le categorie main uniche presenti nei dati
    const allMainCategories = new Set()
    const allTransactions = transactions || []
    
    // Aggiungi le categorie standard
    MAIN_CATS.forEach(cat => allMainCategories.add(cat.key))
    
    // Aggiungi tutte le categorie trovate nelle transazioni
    allTransactions.forEach(t => {
      const mainKey = t.main || 'expense'
      allMainCategories.add(mainKey)
    })
    
    // Dati mensili per il grafico trend (sempre anno corrente)
    const currentYear = new Date().getFullYear()
    const monthlyData = months.map((monthName, index) => {
      // Inizializza monthData con tutte le categorie dinamicamente
      const monthData = { month: monthName }
      
      // Inizializza tutte le categorie a 0
      allMainCategories.forEach(catKey => {
        monthData[catKey] = 0
      })
      
      // Filtra tutte le transazioni (non solo quelle del filtro periodo) per l'anno corrente
      allTransactions.forEach(t => {
        const date = parseLocalDate(t.date)
        if (date.getFullYear() === currentYear && date.getMonth() === index) {
          const mainKey = t.main || 'expense'
          // Ora tutte le categorie sono incluse dinamicamente
          if (monthData.hasOwnProperty(mainKey)) {
            monthData[mainKey] += Number(t.amount || 0)
          }
        }
      })
      
      return monthData
    })

    return {
      sums,
      categorySums,
      monthlyData,
      totalTransactions: filteredTx.length
    }
  }, [transactions, filters?.filterMain])

  // 🔸 Calcolo budgets totali per categoria BASATO sul periodo filtrato
  const budgetTotals = useMemo(() => {
    const totals = { income: 0, expense: 0, debt: 0, saving: 0 }
    const yearBudgets = budgets?.[currentYear] || {}
    
    if (filters?.mode === 'month') {
      // MESE: usa budget del mese specifico
      const monthIndex = filters.pointer?.getMonth() || 0
      for (const key in yearBudgets) {
        const [mainKey, , keyMonth] = key.split(':')
        if (totals.hasOwnProperty(mainKey) && parseInt(keyMonth) === monthIndex) {
          totals[mainKey] += yearBudgets[key] || 0
        }
      }
    } else if (filters?.mode === 'year') {
      // ANNO: somma tutti i mesi
      for (const key in yearBudgets) {
        const [mainKey] = key.split(':')
        if (totals.hasOwnProperty(mainKey)) {
          totals[mainKey] += yearBudgets[key] || 0
        }
      }
    } else if (filters?.mode === 'day') {
      // GIORNO: proporzione del budget del mese (1/30 circa)
      const monthIndex = filters.pointer?.getMonth() || 0
      const daysInMonth = new Date(filters.pointer?.getFullYear() || new Date().getFullYear(), monthIndex + 1, 0).getDate()
      for (const key in yearBudgets) {
        const [mainKey, , keyMonth] = key.split(':')
        if (totals.hasOwnProperty(mainKey) && parseInt(keyMonth) === monthIndex) {
          totals[mainKey] += (yearBudgets[key] || 0) / daysInMonth
        }
      }
    } else if (filters?.mode === 'week') {
      // SETTIMANA: proporzione del budget del mese (1/4.3 circa)
      const monthIndex = filters.pointer?.getMonth() || 0
      const weeksInMonth = 4.33 // Media settimane per mese
      for (const key in yearBudgets) {
        const [mainKey, , keyMonth] = key.split(':')
        if (totals.hasOwnProperty(mainKey) && parseInt(keyMonth) === monthIndex) {
          totals[mainKey] += (yearBudgets[key] || 0) / weeksInMonth
        }
      }
    } else if (filters?.mode === 'range' && filters?.rangeStart && filters?.rangeEnd) {
      // RANGE: calcola proporzionalmente ai mesi coinvolti
      const startMonth = filters.rangeStart.getMonth()
      const endMonth = filters.rangeEnd.getMonth()
      const startYear = filters.rangeStart.getFullYear()
      const endYear = filters.rangeEnd.getFullYear()
      
      if (startYear === endYear) {
        // Stesso anno: calcola giorni per ogni mese coinvolto
        for (let m = startMonth; m <= endMonth; m++) {
          const monthStart = m === startMonth ? filters.rangeStart.getDate() : 1
          const monthEnd = m === endMonth ? filters.rangeEnd.getDate() : new Date(startYear, m + 1, 0).getDate()
          const daysInRange = monthEnd - monthStart + 1
          const totalDaysInMonth = new Date(startYear, m + 1, 0).getDate()
          const monthFactor = daysInRange / totalDaysInMonth
          
          for (const key in yearBudgets) {
            const [mainKey, , keyMonth] = key.split(':')
            if (totals.hasOwnProperty(mainKey) && parseInt(keyMonth) === m) {
              totals[mainKey] += (yearBudgets[key] || 0) * monthFactor
            }
          }
        }
      } else {
        // Multi-anno: per semplicità, calcola solo l'anno corrente
        for (const key in yearBudgets) {
          const [mainKey] = key.split(':')
          if (totals.hasOwnProperty(mainKey)) {
            totals[mainKey] += yearBudgets[key] || 0
          }
        }
      }
    } else {
      // DEFAULT: somma tutti i mesi (comportamento anno)
      for (const key in yearBudgets) {
        const [mainKey] = key.split(':')
        if (totals.hasOwnProperty(mainKey)) {
          totals[mainKey] += yearBudgets[key] || 0
        }
      }
    }
    
    return totals
  }, [
    budgets, 
    currentYear, 
    filters?.mode,
    filters?.pointer?.getMonth(),
    filters?.pointer?.getFullYear(),
    filters?.rangeStart?.getTime(),
    filters?.rangeEnd?.getTime()
  ])

  // 🔸 Dati per i donut charts delle categorie main
  const categoryChartData = useMemo(() => {
    return MAIN_CATS.map(mainCat => ({
      key: mainCat.key,
      name: mainCat.name,
      color: mainCat.color,
      value: aggregatedData.sums[mainCat.key] || 0,
      budget: budgetTotals[mainCat.key] || 0
    }))
  }, [aggregatedData.sums, budgetTotals])

  // 🔸 Transazioni recenti (prime 10 per la sezione Recent)
  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  }, [transactions])

  // 🔸 Funzioni di refresh
  const refreshAllData = () => {
    refreshTransactions()
    refreshBalance()
  }

  return {
    // Dati
    transactions,
    balance,
    aggregatedData,
    categoryChartData,
    recentTransactions,
    
    // Stati
    loading: txLoading || balanceLoading || budgetsLoading,
    txLoading,
    balanceLoading,
    budgetsLoading,
    
    // Budgets
    budgets,
    budgetTotals,
    
    // Funzioni
    refreshTransactions,
    refreshBalance,
    refreshAllData
  }
}

export default useFilteredDashboardData
