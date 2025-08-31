/**
 * 📄 LOANS PAGE: Pagina principale per gestione prestiti/mutui
 * 
 * 🎯 Scopo: Pagina container che gestisce lo stato globale dei prestiti
 * e orchestra tutti i componenti (dashboard, modal, form).
 * 
 * 🎨 Features:
 * - Gestione stato globale con useLoans hook
 * - Coordinamento modal e operazioni CRUD
 * - Integrazione con sistema toast per feedback
 * - Layout responsive con gestione errori
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale pagina prestiti
 */

import React from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useLoans } from '../useLoans.js'
import LoansDashboard from '../components/LoansDashboard.jsx'
import LoanFormModal from '../components/LoanFormModal.jsx'
// import LoanDetailsModal from '../components/LoanDetailsModal.jsx'
// import PaymentRecordModal from '../components/PaymentRecordModal.jsx'
// import PayoffSimulatorModal from '../components/PayoffSimulatorModal.jsx'
// import DeleteLoanModal from '../components/DeleteLoanModal.jsx'

export default function LoansPage() {
  const { token } = useAuth()
  const {
    // Data
    loans,
    selectedLoan,
    loanDetails,
    amortizationSchedule,
    summary,
    
    // State
    loading,
    error,
    modalStates,
    editingLoan,
    selectedPayment,
    
    // Actions
    createLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    simulatePayoff,
    
    // Modal management
    openModal,
    closeModal,
    
    // Utils
    formatCurrency,
    calculateProgress,
    clearError
  } = useLoans(token)

  // =============================================================================
  // 🔸 EVENT HANDLERS
  // =============================================================================

  const handleCreateLoan = async (loanData) => {
    try {
      await createLoan(loanData)
      // Toast success - da implementare
      console.log('✅ Prestito creato con successo')
    } catch (err) {
      // Toast error - da implementare
      console.error('❌ Errore creazione prestito:', err.message)
    }
  }

  const handleUpdateLoan = async (loanId, updateData) => {
    try {
      await updateLoan(loanId, updateData)
      // Toast success
      console.log('✅ Prestito aggiornato con successo')
    } catch (err) {
      // Toast error
      console.error('❌ Errore aggiornamento prestito:', err.message)
    }
  }

  const handleDeleteLoan = async (loanId) => {
    try {
      await deleteLoan(loanId)
      // Toast success
      console.log('✅ Prestito eliminato con successo')
    } catch (err) {
      // Toast error
      console.error('❌ Errore eliminazione prestito:', err.message)
    }
  }

  const handleRecordPayment = async (loanId, paymentNumber, paymentData) => {
    try {
      await recordPayment(loanId, paymentNumber, paymentData)
      // Toast success
      console.log('✅ Pagamento registrato con successo')
    } catch (err) {
      // Toast error
      console.error('❌ Errore registrazione pagamento:', err.message)
    }
  }

  const handleSimulatePayoff = async (loanId, targetMonths) => {
    try {
      const simulation = await simulatePayoff(loanId, targetMonths)
      // Toast success + show results
      console.log('✅ Simulazione completata:', simulation)
      return simulation
    } catch (err) {
      // Toast error
      console.error('❌ Errore simulazione:', err.message)
      throw err
    }
  }

  // =============================================================================
  // 🔸 RENDER
  // =============================================================================

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Main Dashboard */}
      <LoansDashboard 
        loans={loans}
        summary={summary}
        loading={loading}
        error={error}
        openModal={openModal}
        formatCurrency={formatCurrency}
      />

      {/* Modals */}
      {modalStates.createLoan && (
        <LoanFormModal
          isOpen={modalStates.createLoan}
          onClose={() => closeModal('createLoan')}
          onSubmit={handleCreateLoan}
          title="Nuovo Prestito"
        />
      )}

      {modalStates.editLoan && editingLoan && (
        <LoanFormModal
          isOpen={modalStates.editLoan}
          onClose={() => closeModal('editLoan')}
          onSubmit={(data) => handleUpdateLoan(editingLoan.id, data)}
          initialData={editingLoan}
          title="Modifica Prestito"
        />
      )}

      {/* Modal conferma eliminazione */}
      {modalStates.deleteLoan && editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => closeModal('deleteLoan')} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Conferma Eliminazione
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Sei sicuro di voler eliminare il prestito "{editingLoan.name}"? 
                Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => closeModal('deleteLoan')}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleDeleteLoan(editingLoan.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal simulazione estinzione */}
      {modalStates.simulatePayoff && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => closeModal('simulatePayoff')} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Simula Estinzione Anticipata
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Simulazione per il prestito "{selectedLoan.name}".
                <br />Per ora questa è una funzione dimostrativa.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => closeModal('simulatePayoff')}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Chiudi
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleSimulatePayoff(selectedLoan.id, [12, 24, 36])
                      closeModal('simulatePayoff')
                    } catch (err) {
                      console.error('Errore simulazione:', err)
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Simula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Altri modal - da implementare */}
      {/*

      {modalStates.loanDetails && selectedLoan && (
        <LoanDetailsModal
          isOpen={modalStates.loanDetails}
          onClose={() => closeModal('loanDetails')}
          loan={loanDetails}
          schedule={amortizationSchedule}
        />
      )}

      {modalStates.paymentRecord && selectedPayment && (
        <PaymentRecordModal
          isOpen={modalStates.paymentRecord}
          onClose={() => closeModal('paymentRecord')}
          onSubmit={(paymentData) => 
            handleRecordPayment(
              selectedPayment.loan.id,
              selectedPayment.paymentInfo?.paymentNumber || 1,
              paymentData
            )
          }
          loan={selectedPayment.loan}
          paymentInfo={selectedPayment.paymentInfo}
        />
      )}

      {modalStates.simulatePayoff && selectedLoan && (
        <PayoffSimulatorModal
          isOpen={modalStates.simulatePayoff}
          onClose={() => closeModal('simulatePayoff')}
          loan={selectedLoan}
          onSimulate={handleSimulatePayoff}
        />
      )}

      {modalStates.deleteLoan && editingLoan && (
        <DeleteLoanModal
          isOpen={modalStates.deleteLoan}
          onClose={() => closeModal('deleteLoan')}
          onConfirm={() => handleDeleteLoan(editingLoan.id)}
          loan={editingLoan}
        />
      )}
      */}

      {/* Debug info - development only */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              🔧 Debug Info (Dev Only)
            </summary>
            <div className="mt-2 space-y-2 text-slate-600 dark:text-slate-400">
              <div>
                <strong>Loans Count:</strong> {loans.length}
              </div>
              <div>
                <strong>Loading:</strong> {loading.toString()}
              </div>
              <div>
                <strong>Error:</strong> {error || 'None'}
              </div>
              <div>
                <strong>Modal States:</strong> {JSON.stringify(modalStates)}
              </div>
              <div>
                <strong>Summary:</strong> {JSON.stringify(summary)}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
