/**
 * 📄 GOAL CARD COMPONENT: Card interattiva per obiettivo singolo
 * 
 * 🎯 Scopo: Visualizza singolo obiettivo con progress bar, stati dinamici
 * e azioni rapide per gestione saldi
 * 
 * 🔧 Dipendenze principali:
 * - Lucide React per icone
 * - Utility functions per formattazione
 * - TailwindCSS per styling responsive
 * 
 * 📝 Note:
 * - Colori dinamici basati su stato: verde (attivo), giallo (in ritardo), rosso (scaduto)
 * - Progress bar circolare o lineare con percentuale
 * - Quick actions: Aggiungi, Preleva, Modifica, Elimina
 * - Responsive design ottimizzato
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione componente
 */

import React, { useMemo } from 'react'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical
} from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import { Button } from '../../../components/ui/Button.jsx'

/**
 * 🎯 COMPONENT: Card obiettivo di risparmio
 */
export default function GoalCard({ 
  goal, 
  categories,
  onEdit, 
  onDelete, 
  onAddBalance, 
  onWithdraw, 
  onShowHistory 
}) {
  // 🔸 State per menu contestuale
  const [showMenu, setShowMenu] = React.useState(false)
  // 🔸 Calcoli derivati
  const progressPercentage = useMemo(() => {
    return Math.min(Math.max((goal.progressPercentage || 0), 0), 100)
  }, [goal.progressPercentage])

  const isOverdue = useMemo(() => {
    if (!goal.targetDate) return false // Nessuna scadenza = mai in ritardo
    return goal.isOverdue || (new Date() > new Date(goal.targetDate) && goal.status === 'ACTIVE')
  }, [goal.isOverdue, goal.targetDate, goal.status])

  const isCompleted = useMemo(() => {
    return goal.status === 'COMPLETED' || progressPercentage >= 100
  }, [goal.status, progressPercentage])

  const daysRemaining = useMemo(() => {
    if (!goal.targetDate) return null // Nessuna scadenza
    if (isCompleted || isOverdue) return 0
    const today = new Date()
    const target = new Date(goal.targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 0)
  }, [goal.targetDate, isCompleted, isOverdue])

  // 🔸 Calcolo progresso temporale
  const timeProgress = useMemo(() => {
    if (!goal.targetDate) return null // Nessuna scadenza
    if (isCompleted || isOverdue) return 100
    
    const today = new Date()
    const start = new Date(goal.createdAt || goal.targetDate) // Fallback se createdAt non disponibile
    const target = new Date(goal.targetDate)
    
    const totalTime = target.getTime() - start.getTime()
    const elapsedTime = today.getTime() - start.getTime()
    
    if (totalTime <= 0) return 100
    
    return Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100)
  }, [goal.targetDate, goal.createdAt, isCompleted, isOverdue])

  // 🔸 Recupera colore dalla categoria main
  const getCategoryColor = useMemo(() => {
    if (!goal.subcategory?.Category || !categories) {
      return '#5B86E5' // fallback color
    }
    
    const mainCategoryName = goal.subcategory.Category.main
    // Prova sia uppercase che lowercase per il matching
    const category = categories.find(cat => 
      cat.main === mainCategoryName || 
      cat.main?.toUpperCase() === mainCategoryName?.toUpperCase() ||
      cat.key === mainCategoryName?.toLowerCase()
    )
    
    return category?.color || '#5B86E5'
  }, [goal.subcategory, categories])

  // 🔸 Tema colori: light mode originale + dark mode che matcha le card prestiti
  const cardTheme = useMemo(() => {
    if (isCompleted) {
      return {
        bgClass: 'rounded-xl border border-emerald-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group bg-white dark:bg-slate-800 bg-emerald-50/80 dark:bg-emerald-900/10',
        progressColor: '#10B981', // emerald-500
        badgeColor: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-0 dark:border dark:border-emerald-500/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        textColor: 'text-emerald-900 dark:text-slate-100',
        accentColor: '#10B981'
      }
    }
    
    if (isOverdue) {
      return {
        bgClass: 'rounded-xl border border-red-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group bg-white dark:bg-slate-800 bg-red-50/80 dark:bg-red-900/10',
        progressColor: '#EF4444', // red-500
        badgeColor: 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-0 dark:border dark:border-red-500/30',
        iconColor: 'text-red-600 dark:text-red-400',
        textColor: 'text-red-900 dark:text-slate-100',
        accentColor: '#EF4444'
      }
    }
    
    // Tema default: originale light + dark che matcha esattamente le card prestiti
    return {
      bgClass: 'rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50 group bg-white dark:bg-slate-800 bg-slate-50/80 dark:bg-blue-900/10',
      progressColor: '#60A5FA', // blue-400 per consistenza
      badgeColor: 'bg-slate-100 dark:bg-blue-500/20 text-slate-800 dark:text-blue-400 border-0 dark:border dark:border-blue-500/30',
      iconColor: 'text-slate-600 dark:text-blue-400',
      textColor: 'text-slate-900 dark:text-slate-100',
      accentColor: '#60A5FA'
    }
  }, [isCompleted, isOverdue, progressPercentage])

  // 🔸 Status badge
  const renderStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className={`${cardTheme.badgeColor} inline-flex items-center space-x-1`}>
          <CheckCircle className="h-3 w-3" />
          <span>Completato</span>
        </Badge>
      )
    }
    
    if (isOverdue) {
      return (
        <Badge className={`${cardTheme.badgeColor} inline-flex items-center space-x-1`}>
          <AlertTriangle className="h-3 w-3" />
          <span>Scaduto</span>
        </Badge>
      )
    }
    
    return (
      <Badge className={`${cardTheme.badgeColor} inline-flex items-center space-x-1`}>
        <Clock className="h-3 w-3" />
        <span>Attivo</span>
      </Badge>
    )
  }

  // 🔸 Progress bar circolare migliorata
  const renderCircularProgress = () => {
    const radius = 50 // Leggermente più grande
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

    return (
      <div className="relative">
        <svg className="transform -rotate-90 w-28 h-28">
          {/* Background circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700 opacity-30"
          />
          {/* Progress circle con colore dinamico */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={cardTheme.progressColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.1))',
            }}
          />
        </svg>
        
        {/* Percentage text migliorato */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xl font-bold ${cardTheme.textColor} mb-0.5`}>
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isCompleted ? 'Completato!' : progressPercentage > 0 ? 'In corso' : 'Inizia'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 🔸 Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  // 🔸 Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className={`${cardTheme.bgClass}`}>
      <div className="p-6">
      {/* Header con titolo e status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {goal.title}
          </h3>
          <div className="flex items-center mt-1 text-sm text-slate-500 dark:text-slate-400">
            {goal.subcategory?.iconKey && (
              <img 
                src={`/icons/subcategories/${goal.subcategory.iconKey}.svg`}
                alt=""
                className="h-4 w-4 mr-2"
                style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(6%) saturate(1658%) hue-rotate(181deg) brightness(89%) contrast(88%)' }}
              />
            )}
            <span>{goal.subcategory?.name}</span>
          </div>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Progress section */}
      <div className="flex items-center justify-between mb-6">
        {/* Progress circle */}
        <div className="flex-shrink-0">
          {renderCircularProgress()}
        </div>

        {/* Importi e info */}
        <div className="flex-1 ml-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Risparmiato:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(goal.currentAmount)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Obiettivo:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Rimangono:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatCurrency(parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline info con progress bar temporale */}
      {goal.targetDate ? (
        <div className="mb-4 p-3 bg-white/60 dark:bg-slate-700/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Scadenza: {formatDate(goal.targetDate)}
              </span>
            </div>
            
            {!isCompleted && !isOverdue && daysRemaining !== null && (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {daysRemaining} giorni
              </span>
            )}
          </div>
          
          {/* Mini progress bar temporale */}
          {!isCompleted && !isOverdue && timeProgress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Tempo trascorso</span>
                <span>{Math.round(timeProgress)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                <div 
                  className="bg-slate-400 dark:bg-slate-300 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-white/60 dark:bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              💰 Accumulo Soldi - Nessuna scadenza
            </span>
          </div>
        </div>
      )}

      {/* Monthly target suggestion come pill colorata */}
      {!isCompleted && !isOverdue && goal.monthlyTarget && (
        <div className="mb-4 flex items-center justify-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${cardTheme.badgeColor} border ${cardTheme.bgClass.includes('emerald') ? 'border-emerald-200 dark:border-emerald-700' : 
            cardTheme.bgClass.includes('green') ? 'border-green-200 dark:border-green-700' :
            cardTheme.bgClass.includes('blue') ? 'border-blue-200 dark:border-blue-700' :
            'border-sky-200 dark:border-sky-700'}`}>
            <TrendingUp className={`h-4 w-4 ${cardTheme.iconColor}`} />
            <span className={`text-sm font-medium ${cardTheme.textColor}`}>
              💰 {formatCurrency(goal.monthlyTarget)} / mese
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {goal.notes && (
        <div className="mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            "{goal.notes}"
          </p>
        </div>
      )}

      {/* Action buttons migliorati */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        {/* Azioni principali a sinistra */}
        <div className="flex items-center gap-2">
          {/* Quick actions per obiettivi attivi */}
          {goal.status === 'ACTIVE' && (
            <>
              <Button
                size="sm"
                onClick={() => onAddBalance(goal)}
                className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Aggiungi</span>
              </Button>

              {parseFloat(goal.currentAmount || 0) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWithdraw(goal)}
                  className="inline-flex items-center space-x-2 px-3 py-2"
                >
                  <Minus className="h-4 w-4" />
                  <span>Preleva</span>
                </Button>
              )}
            </>
          )}
          
          {/* Quick actions per obiettivi completati - stessa modalità */}
          {goal.status === 'COMPLETED' && parseFloat(goal.currentAmount || 0) > 0 && (
            <>
              <Button
                size="sm"
                onClick={() => onAddBalance(goal)}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Aggiungi</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWithdraw(goal)}
                className="inline-flex items-center space-x-2 px-3 py-2 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <Minus className="h-4 w-4" />
                <span>Preleva</span>
              </Button>
            </>
          )}

          {/* Storico sempre visibile */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShowHistory(goal)}
            className="inline-flex items-center space-x-2 px-3 py-2"
          >
            <History className="h-4 w-4" />
            <span>Storico</span>
          </Button>
        </div>

        {/* Menu contestuale a destra */}
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </Button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(goal)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Modifica</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(goal.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Elimina</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay per chiudere il menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
      </div>
    </div>
  )
}
