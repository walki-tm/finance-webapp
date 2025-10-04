/**
 * 📄 TRANSFERS TAB: Visualizzazione transfers tra accounts
 * 
 * 🎯 Scopo: Tab separato per gestione trasferimenti
 * - Visualizzazione transfers in formato "Account1 -> Account2 €X"
 * - Ordinamento per data (più recenti primi)
 * - Creazione nuovi transfers
 * - Separato dalle transazioni normali per non influire sui calcoli
 * 
 * @author Finance WebApp Team
 * @modified 4 Ottobre 2025 - Creazione componente transfers tab
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '../../ui';
import { Plus, ArrowRight, Calendar, Euro, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import TransferModal from './TransferModal.jsx';

export default function TransfersTab() {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const { token } = useAuth();

  // Caricamento transfers
  const loadTransfers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getTransfers(token);
      setTransfers(response?.transfers || []);
      
    } catch (err) {
      console.error('Error loading transfers:', err);
      setError('Errore nel caricamento dei trasferimenti');
    } finally {
      setIsLoading(false);
    }
  };

  // Caricamento iniziale
  useEffect(() => {
    if (token) {
      loadTransfers();
    }
  }, [token]);

  // Formattazione data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Formattazione importo
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  };

  // Handler per eliminazione transfer
  const handleDelete = async (transferId) => {
    if (!confirm('Sei sicuro di voler eliminare questo trasferimento?')) {
      return;
    }

    try {
      await api.deleteTransfer(token, transferId);
      // Ricarica la lista
      await loadTransfers();
    } catch (err) {
      console.error('Error deleting transfer:', err);
      alert('Errore nell\'eliminazione del trasferimento');
    }
  };

  // Handler per apertura modal nuovo transfer
  const handleNewTransfer = () => {
    setEditingTransfer(null);
    setShowModal(true);
  };

  // Handler per apertura modal modifica transfer
  const handleEditTransfer = (transfer) => {
    setEditingTransfer(transfer);
    setShowModal(true);
  };

  // Handler per chiusura modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransfer(null);
  };

  // Handler per salvataggio transfer (success callback)
  const handleSaveTransfer = async () => {
    await loadTransfers(); // Refresh lista
  };

  // Rendering loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Caricamento trasferimenti...</div>
      </div>
    );
  }

  // Rendering error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">❌ Errore</div>
            <div className="text-slate-600">{error}</div>
            <Button 
              onClick={loadTransfers} 
              className="mt-4"
              variant="outline"
            >
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Trasferimenti
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gestisci i trasferimenti tra i tuoi conti
          </p>
        </div>
        
        <Button
          onClick={handleNewTransfer}
          className="flex items-center gap-2 bg-gradient-to-tr from-emerald-600 to-teal-600"
        >
          <Plus className="h-4 w-4" />
          Nuovo Trasferimento
        </Button>
      </div>

      {/* Lista Transfers */}
      <Card>
        <CardContent>
          {transfers.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <ArrowRight className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Nessun trasferimento
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Non hai ancora effettuato trasferimenti tra i tuoi conti.
              </p>
              <Button 
                onClick={handleNewTransfer}
                className="bg-gradient-to-tr from-emerald-600 to-teal-600"
              >
                Crea il primo trasferimento
              </Button>
            </div>
          ) : (
            // Transfers table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Trasferimento
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Importo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Note
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {/* Data */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-slate-100">
                            {formatDate(transfer.date)}
                          </span>
                        </div>
                      </td>

                      {/* Trasferimento From -> To */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* Account mittente */}
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {transfer.fromAccount?.name || 'Conto sconosciuto'}
                            </div>
                            <div className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                              {transfer.fromAccount?.accountType || 'N/A'}
                            </div>
                          </div>

                          {/* Freccia */}
                          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />

                          {/* Account destinatario */}
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {transfer.toAccount?.name || 'Conto sconosciuto'}
                            </div>
                            <div className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                              {transfer.toAccount?.accountType || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Importo */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Euro className="h-4 w-4 text-emerald-600" />
                          <span className="text-lg font-semibold text-emerald-600">
                            {formatAmount(transfer.amount)}
                          </span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-4 px-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {transfer.note || (
                            <span className="italic opacity-50">Nessuna nota</span>
                          )}
                        </div>
                      </td>

                      {/* Azioni */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditTransfer(transfer)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifica trasferimento"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transfer.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Elimina trasferimento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiche transfers */}
      {transfers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <ArrowRight className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {transfers.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Trasferimenti totali
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatAmount(transfers.reduce((sum, t) => sum + Number(t.amount), 0))}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Volume totale
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {transfers.length > 0 ? formatDate(transfers[0].date) : '-'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Ultimo trasferimento
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Transfer Modal */}
      <TransferModal
        open={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTransfer}
        initial={editingTransfer}
      />
    </div>
  );
}
