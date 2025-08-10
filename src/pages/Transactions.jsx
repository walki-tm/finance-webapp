import React, { useState } from 'react';
import { Card, CardContent, NativeSelect } from '../components/ui.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { MAIN_CATS, months } from '../lib/constants.js';

/**
 * Pagina "Transazioni"
 * - Mostra la cronologia (tabella) + filtri rapidi
 * - onEdit ora non usa più il prompt: chiama openTxEditor per aprire la MODALE (edit)
 *
 * Entità coinvolte:
 * - Transaction: { id, main, sub, amount, date, note }
 * - Categories (MAIN_CATS) e Subcategories (state.subcats) solo per i filtri
 */
export default function Transactions({
  state,           // stato globale (contiene transactions, subcats, ecc.)
  updateTx,        // mutation per aggiornare una transazione esistente
  delTx,           // mutation per cancellare una transazione
  openTxEditor,    // <-- funzione passata da App.jsx: apre la modale in modalità "modifica"
}) {
  // Stato locale dei filtri (mese e macro-categoria)
  const [filter, setFilter] = useState({ month: 'all', main: 'all' });

  // Applico i filtri alla lista completa di transazioni
  const filtered = state.transactions.filter((t) => {
    const monthOk =
      filter.month === 'all'
        ? true
        : new Date(t.date).getMonth() === Number(filter.month);
    const mainOk = filter.main === 'all' ? true : t.main === filter.main;
    return monthOk && mainOk;
  });

  return (
    <div className="grid lg:grid-cols-1 gap-4">
      <Card className="lg:col-span-1">
        <CardContent>
          {/* Barra filtri rapidi (macro-categoria + mese) */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Filtro per macro-categoria (REDDITO/SPESE/DEBITI/RISPARMI) */}
            <NativeSelect
              className="w-40"
              value={filter.main}
              onChange={(v) => setFilter((f) => ({ ...f, main: v }))}
              options={[
                { value: 'all', label: 'Tutti' },
                ...MAIN_CATS.map((m) => ({ value: m.key, label: m.name })),
              ]}
            />

            {/* Filtro per mese (0-11) o tutti i mesi */}
            <NativeSelect
              className="w-40"
              value={filter.month}
              onChange={(v) => setFilter((f) => ({ ...f, month: v }))}
              options={[
                { value: 'all', label: 'Tutti i mesi' },
                ...months.map((m, i) => ({ value: String(i), label: m })),
              ]}
            />
          </div>

          {/* Wrapper per dare più respiro orizzontale alla tabella su schermi piccoli */}
          <div className="-mx-2 md:mx-0">
            <TransactionTable
              rows={filtered}         // righe filtrate (transazioni)
              state={state}           // per risolvere nomi/icone sottocategorie in riga
              // EDIT: apri la modale "TransactionModal" in modalità modifica
              onEdit={(t) => {
                if (typeof openTxEditor === 'function') {
                  openTxEditor(t);     // passa l'oggetto transazione da modificare
                }
              }}
              // DELETE: elimina la transazione selezionata
              onDelete={(t) => delTx(t.id)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
