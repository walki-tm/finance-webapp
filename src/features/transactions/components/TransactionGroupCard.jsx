/**
 * Card placeholder per gruppi di transazioni - implementazione base
 */

import React from 'react'
import { Card, CardContent } from '../../ui'
import { Folder, MoreHorizontal } from 'lucide-react'

export default function TransactionGroupCard({ 
  group, 
  transactions = [], 
  stats = {}, 
  onEdit, 
  onDelete,
  onEditTransaction,
  onDeleteTransaction,
  onMaterialize,
  onMoveTransaction,
  subcats = {},
  mains = []
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {group.name}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stats.activeCount || 0} transazioni attive
                </div>
              </div>
            </div>
            <button
              onClick={onEdit}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          
          {stats.totalAmount && (
            <div className="text-sm">
              <span className="text-slate-600 dark:text-slate-400">Importo totale: </span>
              <span className="font-semibold">€{Math.abs(stats.totalAmount).toFixed(2)}</span>
            </div>
          )}
          
          {stats.nextDue && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Prossima scadenza: {new Date(stats.nextDue).toLocaleDateString('it-IT')}
            </div>
          )}
          
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {transactions.length} transazioni totali
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
