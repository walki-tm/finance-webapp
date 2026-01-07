/**
 * 📊 USE KPI DATA: Hook per dati KPI dashboard
 * 
 * 🎯 Scopo: Fetch statistiche KPI dal backend
 * - Entrate totali
 * - Spese totali
 * - Accantonamenti (transfers ALLOCATE)
 * - Risparmio (transfers SAVING)
 * - Saldo previsto
 * 
 * @author Finance WebApp Team
 * @modified 10 Dicembre 2025 - Creato per sistema KPI
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api.js'

export function useKPIData(token, filters) {
  const [kpiData, setKpiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const fetchKPI = useCallback(async () => {
    if (!token || !filters) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Calcola startDate e endDate dal filtro
      let startDate, endDate
      
      if (filters.mode === 'month') {
        const year = filters.pointer?.getFullYear()
        const month = filters.pointer?.getMonth()
        startDate = new Date(year, month, 1)
        // Ultimo giorno del mese: usa giorno 0 del mese SUCCESSIVO
        const lastDay = new Date(year, month + 1, 0).getDate()
        endDate = new Date(year, month, lastDay)
      } else if (filters.mode === 'year') {
        const year = filters.pointer?.getFullYear()
        startDate = new Date(year, 0, 1)
        endDate = new Date(year, 11, 31)
      } else if (filters.rangeStart && filters.rangeEnd) {
        startDate = filters.rangeStart
        endDate = filters.rangeEnd
      } else {
        // Default: mese corrente
        const now = new Date()
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
      
      // Formatta date per query string (senza timezone shift)
      const formatDate = (date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
      
      const startDateStr = formatDate(startDate)
      const endDateStr = formatDate(endDate)
      
      // Fetch KPI dal backend
      const url = `/api/dashboard/kpi?startDate=${startDateStr}&endDate=${endDateStr}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 KPI Data received:', data)
      setKpiData(data)
      
    } catch (err) {
      console.error('❌ Error fetching KPI:', err)
      setError(err.message)
      // Set default values in caso di errore
      setKpiData({
        totalIncome: 0,
        totalExpenses: 0,
        totalAllocations: 0,
        totalSavings: 0,
        projectedBalance: 0
      })
    } finally {
      setLoading(false)
    }
  }, [token, filters])
  
  useEffect(() => {
    fetchKPI()
  }, [fetchKPI])
  
  return { 
    kpiData, 
    loading, 
    error,
    refresh: fetchKPI 
  }
}

export default useKPIData
