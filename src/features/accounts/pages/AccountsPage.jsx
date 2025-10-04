/**
 * 📄 ACCOUNTS PAGE: Pagina principale gestione conti
 * 
 * 🎯 Scopo: Interfaccia completa per visualizzazione e gestione conti utente
 * 
 * 🔧 Dipendenze principali:
 * - React per UI e state management
 * - useAccounts hook per business logic
 * - AccountCard e AccountModal per UI components
 * 
 * 📝 Note:
 * - Layout responsive con griglia adaptive
 * - Stato di loading e errori gestito
 * - Azioni CRUD complete
 * - Statistiche e overview in tempo reale
 * - Integrazione completa con backend
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Integrazione modal transazione e pulsante quick action
 */

// 🔸 Import dependencies
import React, { useState } from 'react'
import { Plus, CreditCard, TrendingUp, AlertCircle, Loader, Users, BarChart3, Search, Filter, X } from 'lucide-react'
import { Button, Badge } from '../../../components/ui'
import useAccounts from '../useAccounts'
import AccountCard from '../components/AccountCard'
import AccountModal from '../components/AccountModal'
import TransactionModal from '../../transactions/components/TransactionModal'

/**
 * 🎯 COMPONENTE: AccountsPage
 * 
 * @param {Object} props - Props del componente
 * @param {string} props.token - JWT token per autenticazione
 */
export default function AccountsPage({ token }) {
  // 🔸 State management tramite custom hook
  const {
    accounts,
    accountsStats,
    totalAccounts,
    currentAccounts,
    totalCurrentBalance,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
    clearError
  } = useAccounts(token)

  // 🔸 State locale per UI
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL') // ALL, CURRENT, SAVINGS, INVESTMENTS, POCKET
  
  // 🔸 State per modal transazione
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedAccountForTransaction, setSelectedAccountForTransaction] = useState(null)

  // 🔸 Handler per apertura modal creazione
  const handleOpenCreateModal = () => {
    setEditingAccount(null)
    setIsModalOpen(true)
  }

  // 🔸 Handler per apertura modal modifica
  const handleOpenEditModal = (account) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  // 🔸 Handler per chiusura modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAccount(null)
  }

  // 🔸 Handler per salvataggio account (create/update)
  const handleSaveAccount = async (formData) => {
    try {
      if (editingAccount) {
        // Modalità update
        const success = await updateAccount(editingAccount.id, formData)
        return success !== null
      } else {
        // Modalità create
        const success = await createAccount(formData)
        return success !== null
      }
    } catch (err) {
      console.error('Error saving account:', err)
      return false
    }
  }

  // 🔸 Handler per eliminazione account con conferma
  const handleDeleteAccount = async (accountId) => {
    const account = accounts.find(acc => acc.id === accountId)
    if (!account) return

    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare il conto "${account.name}"?\n\nQuesta azione non può essere annullata. Le transazioni collegate verranno disconnesse dal conto.`
    )

    if (confirmed) {
      await deleteAccount(accountId)
    }
  }

  // 🔸 Filtraggio conti basato su ricerca e filtro tipo
  const filteredAccounts = accounts.filter(account => {
    // Filtro per testo di ricerca (nome del conto)
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtro per tipo di conto
    const matchesType = filterType === 'ALL' || account.accountType === filterType
    
    return matchesSearch && matchesType
  })

  // 🔸 Handler per clear ricerca
  const handleClearSearch = () => {
    setSearchQuery('')
    setFilterType('ALL')
  }

  // 🔸 Handler per apertura modal transazione da AccountCard
  const handleOpenTransactionModal = (account) => {
    setSelectedAccountForTransaction(account)
    setIsTransactionModalOpen(true)
  }

  // 🔸 Handler per chiusura modal transazione
  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false)
    setSelectedAccountForTransaction(null)
  }

  // 🔸 Handler salvataggio transazione (refresh accounts dopo il save)
  const handleSaveTransaction = async () => {
    // Dopo aver salvato una transazione, aggiorna i conti per riflettere il nuovo balance
    await refreshAccounts()
    handleCloseTransactionModal()
    return true
  }

  // 🔸 Render loading state
  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-600 dark:text-slate-400">
            Caricamento conti...
          </span>
        </div>
      </div>
    )
  }

  // 🔸 Render error state
  if (error && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Errore caricamento conti
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
          {error}
        </p>
        <div className="flex gap-3">
          <Button onClick={refreshAccounts} variant="secondary">
            Riprova
          </Button>
          <Button onClick={clearError}>
            Ignora
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header compatto */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              I tuoi Conti
            </h1>
            <Button 
              onClick={handleOpenCreateModal} 
              size="sm"
              className="flex items-center gap-2 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestisci e monitora i tuoi conti bancari
          </p>
        </div>
      </div>

      {/* Overview compatto */}
      {accountsStats && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Totale conti */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Conti</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalAccounts}
                </p>
              </div>
            </div>

            {/* Saldo totale */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                totalCurrentBalance > 0 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                  : totalCurrentBalance < 0 
                    ? 'bg-rose-50 dark:bg-rose-900/20'
                    : 'bg-slate-50 dark:bg-slate-900/20'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  totalCurrentBalance > 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : totalCurrentBalance < 0 
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Saldo</p>
                <p className={`text-2xl font-bold ${
                  totalCurrentBalance > 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : totalCurrentBalance < 0 
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {totalCurrentBalance.toLocaleString('it-IT', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </p>
              </div>
            </div>

            {/* Conti correnti */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Correnti</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {currentAccounts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra ricerca e filtri */}
      {accounts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Campo ricerca */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cerca conti per nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filtro tipo */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Tutti i tipi</option>
                <option value="CURRENT">Conto Corrente</option>
                <option value="SAVINGS">Risparmio</option>
                <option value="INVESTMENTS">Investimenti</option>
                <option value="POCKET">Pocket</option>
              </select>
            </div>
            
            {/* Clear filters */}
            {(searchQuery || filterType !== 'ALL') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSearch}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancella
              </Button>
            )}
          </div>
          
          {/* Risultati ricerca */}
          {(searchQuery || filterType !== 'ALL') && (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {filteredAccounts.length === 0 
                ? 'Nessun conto trovato con i criteri attuali'
                : `${filteredAccounts.length} di ${accounts.length} conti visualizzati`
              }
            </div>
          )}
        </div>
      )}

      {/* Lista conti */}
      {accounts.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Nessun conto configurato
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Inizia aggiungendo il tuo primo conto bancario per tenere traccia delle tue finanze
          </p>
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Crea il Primo Conto
          </Button>
        </div>
      ) : (
        /* Grid conti */
        <div className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Nessun risultato
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Non sono stati trovati conti che corrispondono ai criteri di ricerca
              </p>
              <Button 
                variant="outline" 
                onClick={handleClearSearch}
                className="flex items-center gap-2 mx-auto"
              >
                <X className="w-4 h-4" />
                Cancella filtri
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteAccount}
              onAddTransaction={handleOpenTransactionModal}
              isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAccount}
        initialData={editingAccount}
        isLoading={isCreating || isUpdating}
      />
      
      {/* Transaction Modal */}
      {selectedAccountForTransaction && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          onSave={handleSaveTransaction}
          token={token}
          preSelectedAccount={selectedAccountForTransaction}
        />
      )}
    </div>
  )
}
