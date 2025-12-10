/**
 * 📋 OPERATION MODAL: Modale unificata per operazioni
 * 
 * 🎯 Scopo: Modale con 3 tab per creare:
 * - Entrate (INCOME transactions)
 * - Uscite (EXPENSE transactions)
 * - Trasferimenti (Transfers con auto-classificazione)
 * 
 * @author Finance WebApp Team
 * @modified 10 Dicembre 2025 - Creato modale unificata
 */

import React, { useState } from 'react'
import { 
  FiArrowDownCircle, 
  FiArrowUpCircle, 
  FiRepeat, 
  FiX 
} from 'react-icons/fi'

export default function OperationModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('expense') // 'income' | 'expense' | 'transfer'
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Nuova Operazione
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tab Selector */}
        <div className="flex gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <TabButton
            icon={<FiArrowDownCircle />}
            label="Entrata"
            active={activeTab === 'income'}
            onClick={() => setActiveTab('income')}
            color="green"
          />
          <TabButton
            icon={<FiArrowUpCircle />}
            label="Uscita"
            active={activeTab === 'expense'}
            onClick={() => setActiveTab('expense')}
            color="red"
          />
          <TabButton
            icon={<FiRepeat />}
            label="Trasferimento"
            active={activeTab === 'transfer'}
            onClick={() => setActiveTab('transfer')}
            color="blue"
          />
        </div>
        
        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'income' && (
            <IncomeForm onSuccess={onSuccess} onClose={onClose} />
          )}
          {activeTab === 'expense' && (
            <ExpenseForm onSuccess={onSuccess} onClose={onClose} />
          )}
          {activeTab === 'transfer' && (
            <TransferForm onSuccess={onSuccess} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

// 🎨 Tab Button Component
function TabButton({ icon, label, active, onClick, color }) {
  const colorClasses = {
    green: active 
      ? 'bg-emerald-500 text-white' 
      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    red: active 
      ? 'bg-red-500 text-white' 
      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20',
    blue: active 
      ? 'bg-blue-500 text-white' 
      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  }
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${colorClasses[color]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// 📝 Placeholder Forms (da implementare completamente)
function IncomeForm({ onSuccess, onClose }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-slate-500">
        <FiArrowDownCircle className="w-16 h-16 mx-auto mb-4" />
        <p>Form Entrata - Da implementare</p>
        <p className="text-sm mt-2">Campi: Conto, Categoria (INCOME), Sottocategoria, Data, Importo, Nota</p>
      </div>
    </div>
  )
}

function ExpenseForm({ onSuccess, onClose }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-slate-500">
        <FiArrowUpCircle className="w-16 h-16 mx-auto mb-4" />
        <p>Form Uscita - Da implementare</p>
        <p className="text-sm mt-2">Campi: Conto, Categoria, Sottocategoria, Data, Importo, Nota</p>
      </div>
    </div>
  )
}

function TransferForm({ onSuccess, onClose }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-slate-500">
        <FiRepeat className="w-16 h-16 mx-auto mb-4" />
        <p>Form Trasferimento - Da implementare</p>
        <p className="text-sm mt-2">Campi: Da conto, A conto, Importo, Data, Nota</p>
        <p className="text-xs mt-4 text-blue-600">Il trasferimento verrà classificato automaticamente</p>
      </div>
    </div>
  )
}
