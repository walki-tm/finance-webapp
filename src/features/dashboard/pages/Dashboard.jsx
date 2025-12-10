/**
 * 📄 DASHBOARD: Dashboard principale con sistema filtri avanzato
 * 
 * 🎯 Scopo: Dashboard principale con filtri periodo e categoria main
 * 
 * 🔧 Dipendenze:
 * - DashboardFilters per navigazione temporale
 * - useFilteredDashboardData per dati filtrati
 * - useCategories per categorie disponibili
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Aggiunto sistema filtri avanzato
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Badge, NativeSelect, Button } from '../../ui';
import { useAuth } from '../../../context/AuthContext.jsx';
import { api } from '../../../lib/api.js';
import { months, MAIN_CATS } from '../../../lib/constants.js';
import { nice, alpha } from '../../../lib/utils.js';
import { formatDateForAPI, getTodayLocal, getTodayDate, parseLocalDate, getMonthBounds } from '../../../lib/dateUtils.js';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Plus, Settings } from 'lucide-react';

// ⬇️ Nuovi import per sistema filtri
import DashboardFilters from '../components/DashboardFilters.jsx';
import useFilteredDashboardData from '../useFilteredDashboardData.js';
import { useCategories } from '../../categories/useCategories.js';
import { usePlannedTransactions } from '../../transactions/usePlannedTransactions.js';

// ⬇️ Nuovi import per upcoming transactions
import UpcomingPlannedTransactions from '../components/UpcomingPlannedTransactions.jsx';

// ⬇️ usa il nuovo componente che carica e colora SVG da /public/icons
import SvgIcon from '../../icons/components/SvgIcon.jsx';

// ⬇️ Import per KPI Dashboard
import useKPIData from '../useKPIData.js';
import KPICard from '../components/KPICard.jsx';
import { FiArrowDownCircle, FiArrowUpCircle, FiBox, FiTrendingUp, FiCalendar } from 'react-icons/fi';

export default function Dashboard({ state, year, onSelectMain, detailMain, addTx, onNavigateToPlanned }) {
  const { token } = useAuth();
  
  // 🔸 State per filtri
  const [filters, setFilters] = useState(null)
  const [filterMain, setFilterMain] = useState('all')
  
  // 🔸 State per tooltip personalizzato
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null })
  
  
  // 🔸 Hook per categorie disponibili 
  const { mainsForModal: allMainCategories } = useCategories(token)
  
  // 🔸 Hook per transazioni pianificate
  const { plannedTransactions } = usePlannedTransactions(token)
  
  // 🔸 Memoizza l'oggetto filtri per evitare loop infiniti
  const memoizedFilters = useMemo(() => {
    return filters ? { ...filters, filterMain } : null
  }, [filters, filterMain])
  
  // 🔸 Hook per KPI Dashboard
  const { kpiData } = useKPIData(token, memoizedFilters)

  // 🔸 Hook per dati dashboard filtrati
  const {
    balance,
    aggregatedData,
    categoryChartData,
    recentTransactions,
    transactions, // Tutte le transazioni del periodo per DetailPanel
    transfers, // ✅ Transfers con transferType
    budgets,
    budgetTotals,
    miniBoxData, // ✅ Nuovi dati per mini box
    loading,
    refreshAllData
  } = useFilteredDashboardData(token, memoizedFilters)

  // 🔸 Handler per cambio filtri (memoizzati per evitare loop)
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])
  
  const handleFilterMainChange = useCallback((newFilterMain) => {
    setFilterMain(newFilterMain)
  }, [])
  
  // 🔥 OPTIMIZED: Safe projections calculation with loop protection
  const projectedData = useMemo(() => {
    console.log('🔥 PROJECTIONS: Starting calculation with', plannedTransactions?.length || 0, 'transactions')
    
    // 🛡️ Early return if no data to prevent unnecessary calculations
    if (!filters || !plannedTransactions?.length || !categoryChartData?.length) {
      console.log('🛡️ PROJECTIONS: No data, returning basic chart data')
      return categoryChartData || []
    }
    
    try {
      // 🔥 OPTIMIZED: Safe occurrence calculation with multiple protections
      const calculateOccurrencesSafe = (plannedTx, startDate, endDate) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        // 🛡️ Protection 1: Invalid dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('⚠️ Invalid dates for projection:', { startDate, endDate })
          return 0
        }
        
        // 🛡️ Protection 2: End date before start date
        if (end <= start) {
          console.warn('⚠️ End date before start date:', { start, end })
          return 0
        }
        
        // 🛡️ Protection 3: Use fixed next_execution from singleton
        let currentDate = plannedTx.next_execution 
          ? new Date(plannedTx.next_execution)
          : new Date(plannedTx.nextDueDate || plannedTx.startDate || start)
        
        if (isNaN(currentDate.getTime())) {
          console.warn('⚠️ Invalid next_execution date:', plannedTx.next_execution)
          return 0
        }
        
        const frequency = plannedTx.frequency?.toUpperCase() || 'MONTHLY'
        let occurrences = 0
        let iterations = 0
        const MAX_ITERATIONS = 1000 // 🛡️ Protection 4: Hard limit
        
        while (currentDate <= end && iterations < MAX_ITERATIONS) {
          if (currentDate >= start) {
            occurrences++
          }
          
          // 🔥 OPTIMIZED: Safe date increment
          try {
            switch (frequency) {
              case 'DAILY':
                currentDate.setDate(currentDate.getDate() + 1)
                break
              case 'WEEKLY':
                currentDate.setDate(currentDate.getDate() + 7)
                break
              case 'MONTHLY':
                currentDate.setMonth(currentDate.getMonth() + 1)
                break
              case 'QUARTERLY':
                currentDate.setMonth(currentDate.getMonth() + 3)
                break
              case 'SEMIANNUAL':
                currentDate.setMonth(currentDate.getMonth() + 6)
                break
              case 'YEARLY':
                currentDate.setFullYear(currentDate.getFullYear() + 1)
                break
              default:
                // One-time or unknown frequency - calculate once and exit
                occurrences = currentDate >= start && currentDate <= end ? 1 : 0
                // Force exit from while loop for ONE_TIME transactions
                iterations = MAX_ITERATIONS
                break
            }
          } catch (dateError) {
            console.error('❌ Date calculation error:', dateError)
            break
          }
          
          iterations++
          
          // 🛡️ Protection 5: Reasonable occurrence limit
          if (occurrences > 500) {
            console.warn('⚠️ Too many occurrences, capping at 500')
            occurrences = 500
            break
          }
        }
        
        if (iterations >= MAX_ITERATIONS) {
          console.warn('⚠️ Hit max iterations for transaction:', plannedTx.id)
        }
        
        return occurrences
      }
      
      // 🔥 Calculate projections safely
      const now = new Date()
      let startDate, endDate
      
      // 🛡️ Safe date extraction from filters
      if (filters.mode === 'month') {
        const year = filters.pointer.getFullYear()
        const month = filters.pointer.getMonth()
        startDate = new Date(year, month, 1)
        endDate = new Date(year, month + 1, 0)
      } else if (filters.mode === 'year') {
        const year = filters.pointer.getFullYear()
        startDate = new Date(year, 0, 1)
        endDate = new Date(year, 11, 31)
      } else if (filters.rangeStart && filters.rangeEnd) {
        startDate = new Date(filters.rangeStart)
        endDate = new Date(filters.rangeEnd)
      } else {
        console.log('🛡️ No valid date range in filters')
        return categoryChartData || []
      }
      
      // 🛡️ Only future projections (from now onwards)
      const futureStartDate = new Date(Math.max(startDate.getTime(), now.getTime()))
      
      // 🔥 Calculate projections per category
      const projections = {}
      
      plannedTransactions.forEach((tx, index) => {
        if (!tx.isActive) return // Skip inactive
        
        try {
          const mainKey = tx.main?.toLowerCase() || 'expense'
          const occurrences = calculateOccurrencesSafe(tx, futureStartDate, endDate)
          const amount = parseFloat(tx.amount) || 0
          const projectedAmount = amount * occurrences
          
          if (!projections[mainKey]) {
            projections[mainKey] = 0
          }
          projections[mainKey] += projectedAmount
          
          if (index < 3) { // Debug first 3 transactions
            console.log(`📈 Projection ${index + 1}:`, {
              id: tx.id,
              mainKey,
              amount,
              occurrences,
              projectedAmount
            })
          }
        } catch (txError) {
          console.error('❌ Error processing transaction:', tx.id, txError)
        }
      })
      
      // 🔥 Combine real data with projections
      const result = (categoryChartData || []).map(category => {
        const projectedAmount = projections[category.key] || 0
        return {
          ...category,
          projectedValue: projectedAmount,
          totalWithProjections: Math.abs(category.value || 0) + Math.abs(projectedAmount)
        }
      })
      
      console.log('✅ PROJECTIONS: Calculation completed successfully for', result.length, 'categories')
      return result
      
    } catch (error) {
      console.error('❌ PROJECTIONS: Critical error, falling back to basic data:', error)
      return categoryChartData || []
    }
  }, [categoryChartData, plannedTransactions, filters])
  
  // 🔥 OPTIMIZED: Safe planned expenses calculation
  const plannedExpensesForPeriod = useMemo(() => {
    console.log('🔥 PLANNED EXPENSES: Starting calculation')
    
    // 🛡️ Early return if no data
    if (!filters || !plannedTransactions?.length) {
      console.log('🛡️ PLANNED EXPENSES: No data, returning 0')
      return 0
    }
    
    try {
      // 🔥 Calculate period safely
      const now = new Date()
      let startDate, endDate
      
      if (filters.mode === 'month') {
        const year = filters.pointer.getFullYear()
        const month = filters.pointer.getMonth()
        startDate = new Date(year, month, 1)
        endDate = new Date(year, month + 1, 0)
      } else if (filters.mode === 'year') {
        const year = filters.pointer.getFullYear()
        startDate = new Date(year, 0, 1)
        endDate = new Date(year, 11, 31)
      } else if (filters.rangeStart && filters.rangeEnd) {
        startDate = new Date(filters.rangeStart)
        endDate = new Date(filters.rangeEnd)
      } else {
        return 0
      }
      
      // 🛡️ Only future expenses (from now onwards)
      const futureStartDate = new Date(Math.max(startDate.getTime(), now.getTime()))
      
      let totalPlannedExpenses = 0
      let processedCount = 0
      
      plannedTransactions.forEach(tx => {
        if (!tx.isActive || tx.main?.toLowerCase() === 'income') return // Skip income and inactive
        
        try {
          // 🔥 Use fixed next_execution from singleton
          let currentDate = tx.next_execution 
            ? new Date(tx.next_execution)
            : new Date(tx.nextDueDate || tx.startDate || futureStartDate)
          
          if (isNaN(currentDate.getTime())) {
            console.warn('⚠️ Invalid date for expense calculation:', tx.id)
            return
          }
          
          const frequency = tx.frequency?.toUpperCase() || 'MONTHLY'
          const amount = Math.abs(parseFloat(tx.amount) || 0)
          let iterations = 0
          const MAX_ITERATIONS = 500 // 🛡️ Safety limit
          
          while (currentDate <= endDate && iterations < MAX_ITERATIONS) {
            if (currentDate >= futureStartDate) {
              totalPlannedExpenses += amount
            }
            
            // 🔥 Safe date increment
            try {
              switch (frequency) {
                case 'DAILY':
                  currentDate.setDate(currentDate.getDate() + 1)
                  break
                case 'WEEKLY':
                  currentDate.setDate(currentDate.getDate() + 7)
                  break
                case 'MONTHLY':
                  currentDate.setMonth(currentDate.getMonth() + 1)
                  break
                case 'QUARTERLY':
                  currentDate.setMonth(currentDate.getMonth() + 3)
                  break
                case 'SEMIANNUAL':
                  currentDate.setMonth(currentDate.getMonth() + 6)
                  break
                case 'YEARLY':
                  currentDate.setFullYear(currentDate.getFullYear() + 1)
                  break
                default:
                  // One-time - count once and exit loop immediately
                  if (currentDate >= futureStartDate && currentDate <= endDate) {
                    totalPlannedExpenses += amount
                  }
                  // Force exit from while loop for ONE_TIME transactions
                  iterations = MAX_ITERATIONS
                  break
              }
            } catch (dateError) {
              console.error('❌ Date error in expenses calculation:', dateError)
              break
            }
            
            iterations++
            
            // 🛡️ Sanity check
            if (totalPlannedExpenses > 1000000) {
              console.warn('⚠️ Expenses calculation capped at 1M')
              totalPlannedExpenses = 1000000
              break
            }
          }
          
          processedCount++
        } catch (txError) {
          console.error('❌ Error processing expense transaction:', tx.id, txError)
        }
      })
      
      console.log('✅ PLANNED EXPENSES: Processed', processedCount, 'transactions, total:', totalPlannedExpenses)
      return totalPlannedExpenses
      
    } catch (error) {
      console.error('❌ PLANNED EXPENSES: Critical error, returning 0:', error)
      return 0
    }
  }, [plannedTransactions, filters])
  
  
  
  // 🔸 Dati per i grafici (basati su dati filtrati + proiezioni)
  const donutData = projectedData
  const monthly = aggregatedData?.monthlyData || []

  return (
    <div className="space-y-6 select-none" style={{ 
      userSelect: 'none', 
      WebkitUserSelect: 'none', 
      MozUserSelect: 'none', 
      msUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {/* 🔸 Filtri periodo */}
      <div className="flex items-center justify-between">
        <DashboardFilters 
          onFiltersChange={handleFiltersChange}
        />
        
        {loading && (
          <Badge variant="outline" className="rounded-xl animate-pulse select-none">
            Caricamento...
          </Badge>
        )}
      </div>

      {/* 📊 KPI Cards - Statistiche Transfer Type */}
      {kpiData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard
            icon={<FiArrowDownCircle />}
            label="Entrate"
            value={kpiData.totalIncome}
            color="green"
          />
          <KPICard
            icon={<FiArrowUpCircle />}
            label="Uscite"
            value={kpiData.totalExpenses}
            color="red"
          />
          <KPICard
            icon={<FiBox />}
            label="Accantonamenti"
            value={kpiData.totalAllocations}
            color="blue"
          />
          <KPICard
            icon={<FiTrendingUp />}
            label="Risparmio"
            value={kpiData.totalSavings}
            color="gold"
          />
          <KPICard
            icon={<FiCalendar />}
            label="Residuo"
            value={(balance || 0) - plannedExpensesForPeriod}
            color="purple"
          />
        </div>
      )}

      {/* 🔸 Cards categorie main con dati filtrati - Layout 1x4 per visualizzazione orizzontale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {donutData
          .filter(d => d.key !== 'income') // 🚫 Escludi la card INCOME dal rendering
          .map(d => {
          const projectedAmount = Math.abs(d.projectedValue || 0)
          const currentAmount = Math.abs(d.value)
          const totalProjected = currentAmount + projectedAmount
          
          const progressValue = d.budget > 0 ? (totalProjected / d.budget) * 100 : 0
          const hasData = d.value !== 0 || d.budget > 0 || projectedAmount > 0
          const isOverBudget = d.key !== 'core' && d.key !== 'income' && d.budget > 0 && totalProjected > d.budget // Core e Income non hanno overbudget
          const hasProjections = projectedAmount > 0
          const opacity = hasData ? 1 : 0.5 // Sbiadito se non ci sono dati
          
          return (
            <div key={d.key} className="relative group select-none">
              <button onClick={() => onSelectMain?.(d.key)} className="text-left w-full select-none">
                <Card style={{ 
                  borderColor: isOverBudget ? '#fca5a5' : alpha(d.color, .35), 
                  borderWidth: isOverBudget ? '2px' : '1px',
                  opacity,
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }} className="group-hover:shadow-lg group-hover:-translate-y-1">
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full transition-all duration-200 group-hover:w-3 group-hover:h-3" style={{ background: d.color }} />
                        {d.name}
                        {isOverBudget && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-500 rounded-full">
                            Over!
                          </span>
                        )}
                      </div>
                      <div className={`text-xs transition-all duration-200 group-hover:font-semibold ${isOverBudget ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                        {Math.abs(d.value || 0) === 0 ? '-' : nice(d.value)}
                        {d.budget > 0 && (
                          <span>
                            <span className="mx-1">/</span>
                            <span>{nice(d.budget)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <div className="h-32 relative">
                    <ResponsiveContainer>
                      <PieChart>
                        <defs>
                          <linearGradient id={`g-${d.key}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={alpha(d.color, hasData ? .6 : .2)} />
                            <stop offset="100%" stopColor={alpha(d.color, hasData ? 1 : .3)} />
                          </linearGradient>
                        </defs>
                        <Pie
                          isAnimationActive={false}
                          data={(() => {
                            // 🔸 Caso speciale: Account nuovo senza dati né budget
                            if (currentAmount === 0 && d.budget === 0 && projectedAmount === 0) {
                              return [
                                { name: 'vuoto', value: 1, category: d.name, type: 'empty' }
                              ]
                            }
                            
                            if (hasProjections) {
                              // Con proiezioni: ordine SPESO > PROIEZIONI > RIMANENTE/ECCESSO
                              if (isOverBudget) {
                                return [
                                  { name: 'utilizzato', value: currentAmount, category: d.name, type: 'used' },
                                  { name: 'proiezioni', value: projectedAmount, category: d.name, type: 'projected' },
                                  { name: 'eccesso', value: totalProjected - d.budget, category: d.name, type: 'excess' }
                                ]
                              } else {
                                return [
                                  { name: 'utilizzato', value: currentAmount, category: d.name, type: 'used' },
                                  { name: 'proiezioni', value: projectedAmount, category: d.name, type: 'projected' },
                                  { name: 'rimanente', value: Math.max(d.budget - totalProjected, 0), category: d.name, type: 'remaining' }
                                ]
                              }
                            } else {
                              // Senza proiezioni: logica originale
                              if (isOverBudget) {
                                return [
                                  { name: 'utilizzato', value: currentAmount, category: d.name, type: 'used' },
                                  { name: 'eccesso', value: currentAmount - d.budget, category: d.name, type: 'excess' }
                                ]
                              } else {
                                return [
                                  { name: 'utilizzato', value: currentAmount, category: d.name, type: 'used' },
                                  { name: 'rimanente', value: Math.max((d.budget || 0) - currentAmount, 0), category: d.name, type: 'remaining' }
                                ]
                              }
                            }
                          })()} 
                          dataKey="value"
                          innerRadius={42}
                          outerRadius={58}
                          paddingAngle={currentAmount === 0 && d.budget === 0 ? 0 : 1.5}
                        >
                          {/* 🔸 Colori dinamici per le celle del grafico */}
                          {(() => {
                            // Caso speciale: account vuoto
                            if (currentAmount === 0 && d.budget === 0 && projectedAmount === 0) {
                              return <Cell fill={alpha(d.color, .1)} />
                            }
                            
                            // Caso normale: celle multiple
                            const cells = []
                            cells.push(<Cell key="used" fill={isOverBudget ? `url(#g-${d.key})` : `url(#g-${d.key})`} />)
                            
                            if (hasProjections) {
                              cells.push(<Cell key="projected" fill={alpha(d.color, .4)} />)
                            }
                            
                            cells.push(<Cell key="remaining" fill={isOverBudget ? '#fca5a5' : alpha(d.color, hasData ? .15 : .08)} />)
                            
                            return cells
                          })()
                          }
                        </Pie>
                        <Tooltip 
                          position={{ x: 0, y: 0 }}
                          content={({ active, payload, coordinate }) => {
                            if (active && payload && payload.length > 0 && coordinate) {
                              const segment = payload[0].payload
                              const segmentValue = payload[0].value
                              
                              // Calcola la posizione relativa del tooltip rispetto al centro del grafico
                              // Il centro del PieChart è circa a (70, 70) nel ResponsiveContainer
                              const centerX = 70
                              const centerY = 70
                              const mouseX = coordinate.x
                              const mouseY = coordinate.y
                              
                              // Calcola l'angolo per determinare la posizione esterna ottimale
                              const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
                              const distance = 100 // Distanza dal centro per posizionare il tooltip
                              
                              // Calcola posizione esterna basata sull'angolo
                              let externalX = centerX + Math.cos(angle) * distance
                              let externalY = centerY + Math.sin(angle) * distance
                              
                              // Aggiungi offset per evitare sovrapposizioni
                              const tooltipWidth = 120
                              const tooltipHeight = 50
                              
                              // Aggiusta posizione se troppo vicina ai bordi
                              if (externalX < tooltipWidth / 2) externalX = tooltipWidth / 2 + 10
                              if (externalX > 140 - tooltipWidth / 2) externalX = 140 - tooltipWidth / 2 - 10
                              if (externalY < tooltipHeight / 2) externalY = tooltipHeight / 2 + 10
                              if (externalY > 140 - tooltipHeight / 2) externalY = 140 - tooltipHeight / 2 - 10
                              
                              return (
                                <div 
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 text-xs pointer-events-none z-50"
                                  style={{
                                    position: 'absolute',
                                    left: `${externalX - tooltipWidth / 2}px`,
                                    top: `${externalY - tooltipHeight / 2}px`,
                                    width: `${tooltipWidth}px`,
                                    minHeight: `${tooltipHeight}px`,
                                    transform: 'translate(0, 0)'
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || d.color }} />
                                    <span className="font-medium">
                                      {segment.type === 'used' && (d.key === 'income' ? 'Guadagnato' : 'Speso')}
                                      {segment.type === 'projected' && 'Proiezioni'}
                                      {segment.type === 'excess' && 'Eccesso'}
                                      {segment.type === 'remaining' && 'Rimanente'}
                                      {segment.type === 'empty' && 'Nessun dato'}
                                    </span>
                                  </div>
                                  <div className="font-bold text-center" style={{ color: segment.type === 'excess' ? '#ef4444' : d.color }}>
                                    {(() => {
                                      // Per il caso vuoto, mostra sempre 0€ invece del valore interno
                                      if (segment.type === 'empty') return '0€'
                                      return `${segment.type === 'excess' ? '+' : ''}${nice(segmentValue)}`
                                    })()}
                                  </div>
                                  
                                  {/* Linea di connessione dal tooltip al segmento */}
                                  <div
                                    className="absolute w-0.5 bg-slate-300 dark:bg-slate-600"
                                    style={{
                                      left: `${tooltipWidth / 2}px`,
                                      top: '50%',
                                      width: '1px',
                                      height: '20px',
                                      transform: `rotate(${angle + Math.PI}rad)`,
                                      transformOrigin: '0 0'
                                    }}
                                  />
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* 🎯 Percentuale al centro del ring - IMPATTO SULLE ENTRATE */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center transition-all duration-200 group-hover:scale-110">
                        <div className="text-xl font-bold transition-all duration-200 group-hover:text-2xl" style={{ 
                          color: isOverBudget ? '#ef4444' : d.color 
                        }}>
                          {(() => {
                            // 🎯 Mostra SEMPRE la percentuale di impatto sulle entrate
                            // Caso speciale: nessuna spesa o nessuna entrata
                            if (d.incomeImpactPercentage === 0) {
                              return '0%'
                            }
                            
                            // Mostra percentuale impatto con 1 decimale
                            return `${d.incomeImpactPercentage.toFixed(1)}%`
                          })()
                        }
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>
          )
        })}
      </div>

      {/* 🔸 DetailPanel per categorie core */}
      {detailMain && ['income', 'expense', 'debt', 'saving'].includes(detailMain) && (
        <DetailPanel
          mainKey={detailMain}
          filteredData={{
            transactions: transactions || [] // Usa TUTTE le transazioni del periodo filtrato
          }}
          subcats={state?.subcats || {}}
          budgets={budgets}
          filters={filters}
          color={MAIN_CATS.find(m => m.key === detailMain)?.color || '#94a3b8'}
          addTx={addTx}
        />
      )}

      {/* 🔸 DetailPanel per categorie custom */}
      {detailMain && !['income', 'expense', 'debt', 'saving'].includes(detailMain) && (
        <DetailPanel
          mainKey={detailMain}
          filteredData={{
            transactions: transactions || [] // Usa TUTTE le transazioni del periodo filtrato
          }}
          subcats={state?.subcats || {}}
          budgets={budgets}
          filters={filters}
          color={allMainCategories?.find(cat => cat.key === detailMain)?.color || '#94a3b8'}
          addTx={addTx}
        />
      )}


      {/* 🔸 Grafico trend mensile */}
      <Card className="select-none">
        <CardContent>
          <div className="font-medium mb-3">Trend mensile (anno corrente)</div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  {/* Genera dinamicamente gradienti per tutte le categorie */}
                  {(() => {
                    // Trova tutte le categorie che hanno dati nei monthly data
                    const categoriesWithData = new Set()
                    monthly.forEach(monthData => {
                      Object.keys(monthData).forEach(key => {
                        if (key !== 'month' && monthData[key] !== 0) {
                          categoriesWithData.add(key)
                        }
                      })
                    })
                    
                    // Genera gradienti per categorie con dati
                    return Array.from(categoriesWithData).map(categoryKey => {
                      // 🔸 Prima cerca nelle categorie standard (MAIN_CATS)
                      let categoryInfo = MAIN_CATS.find(cat => cat.key === categoryKey)
                      let color = categoryInfo?.color
                      
                      // 🔸 Se non trovata, cerca nelle categorie personalizzate
                      if (!categoryInfo && allMainCategories?.length) {
                        const customCategoryInfo = allMainCategories.find(cat => cat.key === categoryKey)
                        if (customCategoryInfo) {
                          color = customCategoryInfo.color
                        }
                      }
                      
                      // 🔸 Fallback per categorie non trovate
                      if (!color) color = '#94a3b8'
                      
                      return (
                        <linearGradient key={categoryKey} id={`g-${categoryKey}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      )
                    })
                  })()
                  }
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={.2} />
                <XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => nice(v)} />
                
                {/* Genera dinamicamente aree per tutte le categorie */}
                {(() => {
                  // Trova tutte le categorie che hanno dati nei monthly data
                  const categoriesWithData = new Set()
                  monthly.forEach(monthData => {
                    Object.keys(monthData).forEach(key => {
                      if (key !== 'month' && monthData[key] !== 0) {
                        categoriesWithData.add(key)
                      }
                    })
                  })
                  
                  // Genera aree per categorie con dati
                  return Array.from(categoriesWithData).map(categoryKey => {
                    // 🔸 Prima cerca nelle categorie standard (MAIN_CATS)
                    let categoryInfo = MAIN_CATS.find(cat => cat.key === categoryKey)
                    let color = categoryInfo?.color
                    let name = categoryInfo?.name
                    
                    // 🔸 Se non trovata, cerca nelle categorie personalizzate
                    if (!categoryInfo && allMainCategories?.length) {
                      const customCategoryInfo = allMainCategories.find(cat => cat.key === categoryKey)
                      if (customCategoryInfo) {
                        color = customCategoryInfo.color
                        name = customCategoryInfo.name
                      }
                    }
                    
                    // 🔸 Fallback per categorie non trovate
                    if (!color) color = '#94a3b8'
                    if (!name) name = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)
                    
                    return (
                      <Area 
                        key={categoryKey}
                        type="monotone" 
                        dataKey={categoryKey} 
                        name={name}
                        stroke={color} 
                        fill={`url(#g-${categoryKey})`} 
                      />
                    )
                  })
                })()
                }
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* 🔸 Grid transazioni recenti e upcoming */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sezione prossime transazioni pianificate */}
        <UpcomingPlannedTransactions 
          token={token}
          onNavigateToPlanned={() => onNavigateToPlanned?.()} 
          refreshTransactions={refreshAllData}
        />
        
        {/* Sezione transazioni recenti */}
        <Card className="select-none">
          <CardContent>
            <div className="font-medium mb-3">Transazioni recenti ({filters?.label || 'periodo selezionato'})</div>
            {recentTransactions?.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Raggruppa transazioni per data
                  const grouped = recentTransactions.reduce((acc, tx) => {
                    const date = new Date(tx.date).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long'
                    })
                    if (!acc[date]) acc[date] = []
                    acc[date].push(tx)
                    return acc
                  }, {})
                  
                  return Object.entries(grouped).map(([date, transactions]) => (
                    <div key={date}>
                      {/* Intestazione giornaliera */}
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {date}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {transactions.length}
                        </Badge>
                      </div>
                      
                      {/* Transazioni del giorno */}
                      <div className="space-y-2">
                        {transactions.map(tx => {
                          // 🔸 Prima cerca nelle categorie standard (MAIN_CATS)
                          let categoryInfo = MAIN_CATS.find(m => m.key === tx.main)
                          let categoryColor = categoryInfo?.color
                          let categoryName = categoryInfo?.name
                          
                          // 🔸 Se non trovata, cerca nelle categorie personalizzate
                          if (!categoryInfo && allMainCategories?.length) {
                            const customCategoryInfo = allMainCategories.find(cat => cat.key === tx.main)
                            if (customCategoryInfo) {
                              categoryColor = customCategoryInfo.color
                              categoryName = customCategoryInfo.name
                            }
                          }
                          
                          // 🔸 Fallback per categorie non trovate
                          if (!categoryColor) categoryColor = '#94a3b8'
                          if (!categoryName) categoryName = tx.main
                          
                          // 🔸 Trova info sottocategoria per icona
                          const subcatInfo = state?.subcats?.[tx.main]?.find(sc => sc.name === tx.sub)
                          const subcatIconKey = subcatInfo?.iconKey
                          
                          const isIncome = tx.main?.toLowerCase() === 'income'
                          const amountColor = isIncome ? '#10b981' : '#ef4444'
                          
                          return (
                            <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 select-none transition-all">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Icona sottocategoria */}
                                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                  {subcatIconKey ? (
                                    <SvgIcon 
                                      name={subcatIconKey} 
                                      color={categoryColor} 
                                      size={24} 
                                      iconType="sub" 
                                    />
                                  ) : (
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: categoryColor }}
                                    >
                                      {tx.sub ? tx.sub.charAt(0).toUpperCase() : tx.main?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  {/* Sottocategoria come titolo principale */}
                                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                    {tx.sub || categoryName}
                                  </div>
                                  
                                  {/* Descrizione solo se presente */}
                                  {tx.note && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                      {tx.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Importo con colore corretto */}
                              <div className="text-right flex-shrink-0">
                                <div 
                                  className="text-sm font-bold"
                                  style={{ color: amountColor }}
                                >
                                  {isIncome ? '+' : '-'}{nice(Math.abs(tx.amount))}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {new Date(tx.date).toLocaleTimeString('it-IT', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()
                }
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 select-none">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-sm mb-2">Nessuna transazione nel periodo selezionato</p>
                <p className="text-xs text-slate-400">Le transazioni registrate appariranno qui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Floating Action Button per nuove transazioni */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            // Apre il modal per aggiungere una nuova transazione
            // Usa la stessa logica dell'addTx esistente
            const today = formatDateForAPI(getTodayDate())
            
            // Trova la prima sottocategoria della categoria 'expense' come default
            const expenseSubcats = state?.subcats?.expense || []
            const defaultSub = expenseSubcats.length > 0 ? expenseSubcats[0].name : ''
            
            addTx({
              main: 'expense', // Default a spesa
              sub: defaultSub,
              amount: 0,
              date: today,
              note: ''
            })
          }}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
          title="Nuova Transazione"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      
    </div>
  );
}

function DetailPanel({ mainKey, filteredData, subcats, budgets, filters, color, addTx }) {
  const subcatsForCategory = subcats?.[mainKey] || []
  const currentYear = new Date().getFullYear().toString()
  const yearBudgets = budgets?.[currentYear] || {}
  
  // 🔸 Filtra transazioni per periodo E categoria
  const filteredTransactions = filteredData?.transactions?.filter(t => t.main === mainKey) || []
  
  // 🔸 Calcola totale categoria main nel periodo per calcolo percentuali
  // Per income mantieni segno originale, per altre categorie usa valore assoluto
  const totalCategoryAmount = filteredTransactions.reduce((sum, t) => {
    const amount = Number(t.amount || 0)
    const displayAmount = mainKey === 'income' ? amount : Math.abs(amount)
    return sum + displayAmount
  }, 0)
  
  const rows = subcatsForCategory.map(sc => {
    // Transazioni per questa sottocategoria nel periodo filtrato
    const subTransactions = filteredTransactions.filter(t => t.sub === sc.name)
    const actualAmount = subTransactions.reduce((sum, t) => {
      const amount = Number(t.amount || 0)
      // Per income mantieni segno originale, per altre categorie usa valore assoluto
      const displayAmount = mainKey === 'income' ? amount : Math.abs(amount)
      return sum + displayAmount
    }, 0)
    
    // Budget per sottocategoria (calcolo dinamico basato sui filtri periodo)
    let budget = 0
    if (filters?.mode === 'month') {
      // Singolo mese
      const monthIndex = filters.pointer?.getMonth() || 0
      const budgetKey = `${mainKey}:${sc.name}:${monthIndex}`
      budget = yearBudgets[budgetKey] || 0
    } else if (filters?.mode === 'year') {
      // Somma tutti i mesi dell'anno
      for (let m = 0; m < 12; m++) {
        const budgetKey = `${mainKey}:${sc.name}:${m}`
        budget += yearBudgets[budgetKey] || 0
      }
    } else if (filters?.rangeStart && filters?.rangeEnd) {
      // Range custom: calcola proporzionalmente ai mesi interessati
      const startMonth = filters.rangeStart.getMonth()
      const endMonth = filters.rangeEnd.getMonth()
      const startYear = filters.rangeStart.getFullYear()
      const endYear = filters.rangeEnd.getFullYear()
      
      if (startYear === endYear) {
        // Stesso anno
        for (let m = startMonth; m <= endMonth; m++) {
          const budgetKey = `${mainKey}:${sc.name}:${m}`
          budget += yearBudgets[budgetKey] || 0
        }
      } else {
        // Multi-anno (per semplicità, calcola solo l'anno corrente)
        for (let m = 0; m < 12; m++) {
          const budgetKey = `${mainKey}:${sc.name}:${m}`
          budget += yearBudgets[budgetKey] || 0
        }
      }
    }
    
    // Percentuale sul totale categoria nel periodo
    const percentageOfCategory = totalCategoryAmount > 0 ? (actualAmount / totalCategoryAmount * 100) : 0
    const isOverBudget = budget > 0 && actualAmount > budget
    
    return { 
      sub: sc.name, 
      iconKey: sc.iconKey, 
      budget, 
      actualAmount,
      isIncome: mainKey === 'income',
      percentageOfCategory: Math.round(percentageOfCategory * 100) / 100,
      isOverBudget
    }
  })
  
  const totals = rows.reduce((acc, row) => ({
    budget: acc.budget + row.budget,
    actualAmount: acc.actualAmount + row.actualAmount
  }), { budget: 0, actualAmount: 0 })

  const [qaOpen, setQaOpen] = useState(false);
  const [qaSub, setQaSub] = useState(subcatsForCategory[0]?.name || '');
  const [qaAmt, setQaAmt] = useState(0);
  const [qaDate, setQaDate] = useState(formatDateForAPI(getTodayDate()));
  const [qaNote, setQaNote] = useState('');

  useEffect(() => { setQaSub(subcatsForCategory[0]?.name || ''); }, [mainKey, subcatsForCategory]);

  function submitQuick(e) {
    e?.preventDefault?.();
    if (!qaSub) return;
    
    // 🔸 Calcola l'importo corretto in base alla categoria
    const rawAmount = Number(qaAmt)
    const correctAmount = mainKey === 'income' 
      ? Math.abs(rawAmount) // Income: sempre positivo
      : -Math.abs(rawAmount) // Altre categorie: sempre negative
    
    addTx({ main: mainKey, sub: qaSub, amount: correctAmount, date: qaDate, note: qaNote });
    setQaAmt(0); setQaNote('');
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            Dettaglio {MAIN_CATS.find(m => m.key === mainKey)?.name}
          </div>
        </div>

        {qaOpen && (
          <div className="mb-4 grid md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/30 rounded-xl p-3">
            <div>
              <label className="block text-sm mb-1">Sottocategoria</label>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={qaSub}
                onChange={(e) => setQaSub(e.target.value)}
              >
                {subcatsForCategory.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Data</label>
              <input className="w-full rounded-xl border px-3 py-2" type="date" value={qaDate} onChange={(e) => setQaDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Importo (€)</label>
              <input className="w-full rounded-xl border px-3 py-2" type="number" value={qaAmt} onChange={(e) => setQaAmt(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Note</label>
              <input className="w-full rounded-xl border px-3 py-2" value={qaNote} onChange={(e) => setQaNote(e.target.value)} placeholder="Facoltativo" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button className="w-full rounded-xl" onClick={submitQuick}>
                <Plus className="h-4 w-4 mr-2" />Aggiungi
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-auto rounded-xl border border-slate-200/20">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="text-left p-2 w-16">Sottocategoria</th>
                {rows.length > 0 && rows[0].isIncome ? (
                  <th className="text-right p-2">Entrata</th>
                ) : (
                  <th className="text-right p-2">Uscita</th>
                )}
                <th className="text-right p-2">Budget</th>
                <th className="text-right p-2">% del periodo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.sub} className={`border-t border-slate-200/10 ${
                  r.isOverBudget ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                }`}>
                  {/* 🔸 Sottocategoria con icona */}
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <SvgIcon name={r.iconKey} color={color} size={16} iconType="sub" />
                      <span className="font-medium">{r.sub}</span>
                      {r.isOverBudget && (
                        <span className="ml-1 px-1 py-0.5 text-xs bg-amber-100 text-amber-600 rounded">
                          Over!
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* 🔸 Entrata/Uscita basata su categoria */}
                  <td className="p-2 text-right font-medium">
                    <span style={{ 
                      color: r.isOverBudget ? '#d97706' : (r.isIncome ? '#10b981' : '#ef4444')
                    }}>
                      {r.actualAmount === 0 ? '-' : `${r.isIncome ? '+' : '-'}${nice(r.actualAmount)}`}
                    </span>
                  </td>
                  
                  {/* 🔸 Budget */}
                  <td className={`p-2 text-right ${
                    r.isOverBudget ? 'text-amber-600 font-medium' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {r.budget > 0 ? nice(r.budget) : '-'}
                  </td>
                  
                  {/* 🔸 % del periodo con mini progress bar */}
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ 
                            width: `${Math.min(r.percentageOfCategory, 100)}%`,
                            backgroundColor: r.isOverBudget ? '#fbbf24' : (r.isIncome ? '#10b981' : color)
                          }}
                        />
                      </div>
                      <span className="font-medium text-xs min-w-[3rem]">{r.percentageOfCategory.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Riga totali */}
              <tr className="border-t-2 border-slate-300/20 font-bold">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ background: color }} />
                    <span>Totale {MAIN_CATS.find(m => m.key === mainKey)?.name}</span>
                  </div>
                </td>
                <td className="p-2 text-right">
                  <span style={{ color: rows.length > 0 && rows[0].isIncome ? '#10b981' : '#ef4444' }}>
                    {(() => {
                      if (rows.length > 0 && rows[0].isIncome) {
                        // Per le entrate: se il totale è 0, mostra "-", altrimenti "+importo"
                        return totals.actualAmount === 0 ? '-' : `+${nice(totals.actualAmount)}`
                      } else {
                        // Per le altre categorie: se è 0 mostra "-", altrimenti "-importo"
                        return totals.actualAmount === 0 ? '-' : `-${nice(totals.actualAmount)}`
                      }
                    })()}
                  </span>
                </td>
                <td className="p-2 text-right">
                  {totals.budget > 0 ? nice(totals.budget) : '-'}
                </td>
                <td className="p-2 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
