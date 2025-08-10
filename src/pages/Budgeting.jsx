import React, { useMemo, useState } from 'react'
import { Card, CardContent, Label, Input, NativeSelect } from '../components/ui.jsx'
import { MAIN_CATS } from '../lib/constants.js'
import { nice } from '../lib/utils.js'
import { IconView } from '../components/IconPicker.jsx'

export default function Budgeting({ state, year, upsertBudget }){
  const [selMain,setSelMain]=useState('expense')
  const entries = (state.subcats[selMain]||[]).map(sc=>({ key:`${selMain}:${sc.name}`, sub:sc.name, iconKey:sc.iconKey, value: state.budgets[year]?.[`${selMain}:${sc.name}`] || 0 }))
  const ytd = useMemo(()=>{
    const m={}; state.transactions.forEach(t=>{ const d=new Date(t.date); if(d.getFullYear()===Number(year)){ const k=`${t.main}:${t.sub}`; m[k]=(m[k]||0)+t.amount; } }); return m
  },[state.transactions,year])
  const total = entries.reduce((a,b)=>a+b.value,0)
  const mainColor = MAIN_CATS.find(m=>m.key===selMain)?.color

  return (
    <div className="space-y-6">
      <Card><CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div><Label>Sezione</Label><NativeSelect className="w-56" value={selMain} onChange={setSelMain} options={MAIN_CATS.map(m=>({value:m.key,label:m.name}))}/></div>
        </div>
      </CardContent></Card>

      <Card><CardContent>
        <div className="font-medium mb-3">Budget annuale per sottocategoria</div>
        <div className="overflow-auto rounded-xl border border-slate-200/20">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800"><tr>
              <th className="text-left p-2 w-10">Icona</th>
              <th className="text-left p-2">Sottocategoria</th>
              <th className="text-right p-2">Budget annuo</th>
              <th className="text-right p-2">Effettivo YTD</th>
              <th className="text-right p-2">Scostamento</th>
            </tr></thead>
            <tbody>
              {entries.map(e=>{
                const eff = ytd[`${selMain}:${e.sub}`] || 0; const delta = (e.value||0) - eff;
                return (
                  <tr key={e.key} className="border-t border-slate-200/10">
                    <td className="p-2"><IconView name={e.iconKey} color={mainColor} customIcons={state.customIcons}/></td>
                    <td className="p-2">{e.sub}</td>
                    <td className="p-2 text-right"><Input type="number" defaultValue={e.value} onBlur={(ev)=>upsertBudget(selMain, e.sub, Number(ev.target.value||0))}/></td>
                    <td className="p-2 text-right">{nice(eff)}</td>
                    <td className={delta<0?'p-2 text-right text-red-500':'p-2 text-right text-emerald-500'}>{nice(delta)}</td>
                  </tr>
                )
              })}
              {entries.length===0 && (<tr><td className="p-4 text-center text-slate-500" colSpan={5}>Nessuna sottocategoria. Aggiungile nella pagina Categorie.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm">Totale {MAIN_CATS.find(m=>m.key===selMain)?.name}: <b>{nice(total)}</b></div>
      </CardContent></Card>
    </div>
  )
}
