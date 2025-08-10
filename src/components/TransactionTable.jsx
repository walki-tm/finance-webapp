import React from 'react'
import { Button } from './ui.jsx'
import { Pencil, Trash2 } from 'lucide-react'
import { MAIN_CATS } from '../lib/constants.js'
import { nice } from '../lib/utils.js'
import { IconView } from './IconPicker.jsx'

export default function TransactionTable({ rows, state, onEdit, onDelete }){
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/20">
      <table className="min-w-[1200px] w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
          <tr>
            <th className="text-left p-2 whitespace-nowrap">Data</th>
            <th className="text-left p-2 whitespace-nowrap">Tipo</th>
            <th className="text-left p-2 whitespace-nowrap">Sottocategoria</th>
            <th className="text-right p-2 whitespace-nowrap">Importo</th>
            <th className="text-left p-2 whitespace-nowrap">Note</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t=>{
            const mc = MAIN_CATS.find(m=>m.key===t.main)
            const sc = (state.subcats[t.main]||[]).find(s=>s.name===t.sub)
            return (
              <tr key={t.id} className="border-t border-slate-200/10">
                <td className="p-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString('it-IT')}</td>
                <td className="p-2 whitespace-nowrap">{mc?.name}</td>
                <td className="p-2 whitespace-nowrap flex items-center gap-2"><IconView name={sc?.iconKey} color={mc?.color} customIcons={state.customIcons}/> {t.sub}</td>
                <td className="p-2 text-right whitespace-nowrap">{nice(t.amount)}</td>
                <td className="p-2 whitespace-nowrap">{t.note}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={()=>onEdit(t)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={()=>onDelete(t)}><Trash2 className="h-4 w-4"/></Button>
                </td>
              </tr>
            )
          })}
          {rows.length===0 && (<tr><td className="p-4 text-center text-slate-500" colSpan={6}>Nessuna transazione</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
