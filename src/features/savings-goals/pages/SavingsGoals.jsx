/**
 * 📄 SAVINGS GOALS PAGE: Pagina principale obiettivi di risparmio
 * 
 * 🎯 Scopo: Interfaccia principale per gestione obiettivi con griglia responsive
 * di cards interattive e azioni rapide
 * 
 * 🔧 Dipendenze principali:
 * - useSavingsGoals hook per state management
 * - useCategories per integrazione categorie
 * - Componenti UI riutilizzabili
 * 
 * 📝 Note:
 * - Layout responsive: 3 colonne desktop, 2 tablet, 1 mobile
 * - Cards interattive con progress bars e quick actions
 * - Stati dinamici: verde/giallo/rosso basati su progresso e scadenze
 * - Modali per operazioni CRUD e gestione saldi
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione pagina
 */

import React, { useState, useMemo } from 'react'
import { Plus, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import useSavingsGoals from '../useSavingsGoals.js'
import { useCategories } from '../../categories/useCategories.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import GoalCard from '../components/GoalCard.jsx'
import GoalModal from '../components/GoalModal.jsx'
import AddBalanceModal from '../components/AddBalanceModal.jsx'
import WithdrawModal from '../components/WithdrawModal.jsx'
import GoalHistoryModal from '../components/GoalHistoryModal.jsx'
import CompletedGoalConfirmDialog from '../components/CompletedGoalConfirmDialog.jsx'

/**
 * 🎯 COMPONENT: Pagina principale obiettivi di risparmio
 */
export default function SavingsGoals() {
  // 🔸 Hooks
  const { token } = useAuth()
  const {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
    withdrawFromGoal,
    getGoalHistory,
    getGoalsStats,
    repeatCompletedGoal
  } = useSavingsGoals(token)
  const { mainsForModal, subcats } = useCategories(token)
  
  // 🔸 Combina categories con subcategories per il GoalModal
  const categories = useMemo(() => {
    if (!mainsForModal || !subcats) return []
    
    return mainsForModal.map(mainCat => ({
      ...mainCat,
      main: mainCat.key.toUpperCase(), // GoalModal si aspetta 'main' in uppercase
      subcats: subcats[mainCat.key] || [] // Aggiunge sottocategorie
    }))
  }, [mainsForModal, subcats])

  // 🔸 State per modali
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showCompletedGoalConfirm, setShowCompletedGoalConfirm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState(0)
  
  // 🔸 State per filtri
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'active', 'completed', 'progress'

  // 🔸 Statistiche calcolate
  const stats = useMemo(() => getGoalsStats(), [getGoalsStats])

  // 🔸 Goals organizzati per stato
  const activeGoals = useMemo(() => {
    if (!goals || !Array.isArray(goals)) return []
    return goals.filter(goal => goal.status === 'ACTIVE')
      .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
  }, [goals])

  const completedGoals = useMemo(() => {
    if (!goals || !Array.isArray(goals)) return []
    return goals.filter(goal => goal.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [goals])
  
  // 🔸 Goals filtrati basati sul filtro attivo
  const filteredGoals = useMemo(() => {
    if (!goals || !Array.isArray(goals)) return []
    
    switch (activeFilter) {
      case 'active':
        return activeGoals
      case 'completed':
        return completedGoals
      case 'progress':
        // Obiettivi con progresso > 0% ma < 100%
        return goals.filter(goal => {
          const progress = goal.progressPercentage || 0
          return progress > 0 && progress < 100 && goal.status === 'ACTIVE'
        }).sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
      case 'all':
      default:
        return [...activeGoals, ...completedGoals]
    }
  }, [goals, activeFilter, activeGoals, completedGoals])

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================

  /**
   * 🔸 Handler per aprire modal nuovo obiettivo
   */
  const handleNewGoal = () => {
    setSelectedGoal(null)
    setIsEditing(false)
    setShowGoalModal(true)
  }

  /**
   * 🔸 Handler per modificare obiettivo
   */
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal)
    setIsEditing(true)
    setShowGoalModal(true)
  }

  /**
   * 🔸 Handler per aggiungere saldo
   */
  const handleAddBalance = (goal) => {
    setSelectedGoal(goal)
    setShowAddBalanceModal(true)
  }

  /**
   * 🔸 Handler per prelevare saldo
   */
  const handleWithdraw = (goal) => {
    setSelectedGoal(goal)
    setShowWithdrawModal(true)
  }

  /**
   * 🔸 Handler per visualizzare storico
   */
  const handleShowHistory = (goal) => {
    setSelectedGoal(goal)
    setShowHistoryModal(true)
  }

  /**
   * 🔸 Handler per eliminare obiettivo
   */
  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo obiettivo? L\'operazione non può essere annullata.')) {
      try {
        await deleteGoal(goalId)
      } catch (error) {
        console.error('Errore nell\'eliminazione:', error)
      }
    }
  }

  // =============================================================================
  // 🔸 MODAL HANDLERS
  // =============================================================================

  const handleGoalSubmit = async (goalData) => {
    try {
      if (isEditing && selectedGoal) {
        await updateGoal(selectedGoal.id, goalData)
      } else {
        await createGoal(goalData)
      }
      setShowGoalModal(false)
    } catch (error) {
      console.error('Errore nell\'operazione:', error)
    }
  }

  const handleAddBalanceSubmit = async (amount, notes) => {
    try {
      await addToGoal(selectedGoal.id, amount, notes)
      setShowAddBalanceModal(false)
    } catch (error) {
      console.error('Errore nell\'aggiunta saldo:', error)
    }
  }

  const handleWithdrawSubmit = async (amount, notes, subcategoryId) => {
    try {
      await withdrawFromGoal(selectedGoal.id, amount, notes, subcategoryId)
      
      // Controlla se è stato prelevato tutto da un obiettivo completato
      if (selectedGoal.status === 'COMPLETED' && amount === selectedGoal.currentBalance) {
        setPendingWithdrawAmount(amount)
        setShowCompletedGoalConfirm(true)
      }
      
      setShowWithdrawModal(false)
    } catch (error) {
      console.error('Errore nel prelievo:', error)
    }
  }

  /**
   * 🔸 Handler per gestire la ripetizione di un obiettivo completato
   */
  const handleRepeatGoal = async () => {
    try {
      if (selectedGoal) {
        await repeatCompletedGoal(selectedGoal.id)
        setShowCompletedGoalConfirm(false)
        setSelectedGoal(null)
        setPendingWithdrawAmount(0)
      }
    } catch (error) {
      console.error('Errore nella ripetizione obiettivo:', error)
    }
  }

  /**
   * 🔸 Handler per gestire l'eliminazione di un obiettivo dopo prelievo totale
   */
  const handleConfirmDelete = async () => {
    try {
      if (selectedGoal) {
        await deleteGoal(selectedGoal.id)
        setShowCompletedGoalConfirm(false)
        setSelectedGoal(null)
        setPendingWithdrawAmount(0)
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione obiettivo:', error)
    }
  }

  /**
   * 🔸 Handler per annullare il dialog di conferma
   */
  const handleCancelConfirm = () => {
    setShowCompletedGoalConfirm(false)
    setSelectedGoal(null)
    setPendingWithdrawAmount(0)
  }

  // =============================================================================
  // 🔸 RENDER HELPERS
  // =============================================================================

  /**
   * 🔸 Renderizza dashboard statistiche cliccabili
   */
  const renderStatsCards = () => {
    const statsData = [
      {
        key: 'all',
        label: 'Obiettivi Totali',
        value: stats.totalGoals,
        icon: Target,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400'
      },
      {
        key: 'active',
        label: 'Attivi',
        value: stats.activeGoals,
        icon: TrendingUp,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400'
      },
      {
        key: 'completed',
        label: 'Completati',
        value: stats.completedGoals,
        icon: CheckCircle,
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        key: 'progress',
        label: 'In Progresso',
        value: `${Math.round(stats.averageProgress)}%`,
        icon: Calendar,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400'
      }
    ]
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statsData.map((stat) => {
          const IconComponent = stat.icon
          const isActive = activeFilter === stat.key
          
          return (
            <div 
              key={stat.key}
              className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group bg-white dark:bg-slate-800 bg-slate-50/80 dark:bg-blue-900/10 p-4 cursor-pointer ${
                isActive 
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                  : ''
              }`}
              onClick={() => setActiveFilter(stat.key)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <IconComponent className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    isActive 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {stat.label}
                  </p>
                  <p className={`text-xl font-bold ${
                    isActive 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {stat.value}
                  </p>
                </div>
              </div>
              
              {/* Indicatore filtro attivo */}
              {isActive && (
                <div className="mt-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * 🔸 Renderizza sezione obiettivi vuota
   */
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Target className="h-12 w-12 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Nessun obiettivo di risparmio
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
        Crea il tuo primo obiettivo di risparmio per iniziare a monitorare i tuoi progressi verso i tuoi obiettivi finanziari.
      </p>
      <Button onClick={handleNewGoal} className="inline-flex items-center space-x-2">
        <Plus className="h-4 w-4" />
        <span>Crea Primo Obiettivo</span>
      </Button>
    </div>
  )

  /**
   * 🔸 Renderizza griglia obiettivi
   */
  const renderGoalsGrid = (goalsList, title, emptyMessage) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
      {goalsList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {goalsList.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              categories={categories}
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoal(goal.id)}
              onAddBalance={() => handleAddBalance(goal)}
              onWithdraw={() => handleWithdraw(goal)}
              onShowHistory={() => handleShowHistory(goal)}
            />
          ))}
        </div>
      )}
    </div>
  )

  // =============================================================================
  // 🔸 MAIN RENDER
  // =============================================================================

  if (isLoading && goals.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Caricamento obiettivi...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Obiettivi di Risparmio
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitora e gestisci i tuoi obiettivi finanziari
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Reset filtro se attivo */}
            {activeFilter !== 'all' && (
              <Button 
                variant="outline"
                onClick={() => setActiveFilter('all')}
                className="inline-flex items-center space-x-2 text-sm"
              >
                <span>Mostra Tutti</span>
              </Button>
            )}
            
            <Button 
              onClick={handleNewGoal}
              className="inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuovo Obiettivo</span>
            </Button>
          </div>
        </div>

        {/* Mostra statistiche solo se ci sono obiettivi */}
        {goals.length > 0 && renderStatsCards()}

        {/* Contenuto principale */}
        {goals.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Sezione filtrata */}
            {activeFilter !== 'all' ? (
              // Vista filtrata singola
              renderGoalsGrid(
                filteredGoals,
                activeFilter === 'active' ? 'Obiettivi Attivi' :
                activeFilter === 'completed' ? 'Obiettivi Completati' :
                activeFilter === 'progress' ? 'Obiettivi In Progresso' : 'Tutti gli Obiettivi',
                activeFilter === 'active' ? 'Nessun obiettivo attivo al momento' :
                activeFilter === 'completed' ? 'Nessun obiettivo completato' :
                activeFilter === 'progress' ? 'Nessun obiettivo in progresso' : 'Nessun obiettivo trovato'
              )
            ) : (
              // Vista completa (filtro 'all')
              <>
                {/* Obiettivi attivi */}
                {renderGoalsGrid(
                  activeGoals, 
                  'Obiettivi Attivi', 
                  'Nessun obiettivo attivo al momento'
                )}

                {/* Obiettivi completati */}
                {completedGoals.length > 0 && renderGoalsGrid(
                  completedGoals,
                  'Obiettivi Completati',
                  'Nessun obiettivo completato'
                )}
              </>
            )}
          </>
        )}

        {/* Modali */}
        {showGoalModal && (
          <GoalModal
            isOpen={showGoalModal}
            onClose={() => setShowGoalModal(false)}
            onSubmit={handleGoalSubmit}
            goal={selectedGoal}
            isEditing={isEditing}
            categories={categories}
          />
        )}

        {showAddBalanceModal && (
          <AddBalanceModal
            isOpen={showAddBalanceModal}
            onClose={() => setShowAddBalanceModal(false)}
            onSubmit={handleAddBalanceSubmit}
            goal={selectedGoal}
          />
        )}

        {showWithdrawModal && (
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            onSubmit={handleWithdrawSubmit}
            goal={selectedGoal}
            categories={categories}
          />
        )}

        {showHistoryModal && (
          <GoalHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            goal={selectedGoal}
            getGoalHistory={getGoalHistory}
          />
        )}

        {showCompletedGoalConfirm && (
          <CompletedGoalConfirmDialog
            isOpen={showCompletedGoalConfirm}
            goal={selectedGoal}
            withdrawAmount={pendingWithdrawAmount}
            onRepeat={handleRepeatGoal}
            onDelete={handleConfirmDelete}
            onCancel={handleCancelConfirm}
          />
        )}
      </div>
    </div>
  )
}
