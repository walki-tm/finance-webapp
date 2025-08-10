import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, Badge, NativeSelect, Button } from '../components/ui.jsx'
import { months, MAIN_CATS } from '../lib/constants.js'
import { nice, alpha } from '../lib/utils.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Plus } from 'lucide-react'
import { IconView } from '../components/IconPicker.jsx'

export default function Dashboard({ state, year, onSelectMain, detailMain, addTx }){
  const [range, setRange] = useState('year')
  const [month, setMonth] = useState(new Date().getMonth())

  const txInRange = useMemo(()=>{
    const now = new Date()
    return state.transactions.filter(t=>{
      const d = new Date(t.date)
      if (range==='month') return d.getFullYear()===now.getFullYear() && d.getMonth()===month
      if (range==='last3'){ const m = new Date(now); m.setMonth(now.getMonth()-2); m.setDate(1); return d>=m && d<=now }
      if (range==='last6'){ const m = new Date(now); m.setMonth(now.getMonth()-5); m.setDate(1); return d>=m && d<=now }
      return d.getFullYear()===now.getFullYear()
    })
  }, [state.transactions, range, month])

  const sums = useMemo(()=>{
    const s = { income:0, expense:0, debt:0, saving:0 }
    txInRange.forEach(t=>{ s[t.main]+=t.amount; })
    return s
  }, [txInRange])

  const budgetTotals = useMemo(()=>{
    const map = state.budgets[year]||{}; const totals = { income:0, expense:0, debt:0, saving:0 }
    for(const k in map){ const [m]=k.split(':'); totals[m]+=map[k] } return totals
  }, [state.budgets, year])

  const donutData = MAIN_CATS.map(mc=>({ name:mc.name, key:mc.key, value:sums[mc.key], color:mc.color, budget:budgetTotals[mc.key] }))

  const monthly = useMemo(()=>{
    const arr = months.map((m,i)=>({ m, income:0, expense:0, debt:0, saving:0 }))
    state.transactions.forEach(t=>{ const d=new Date(t.date); if(d.getFullYear().toString()===year){ arr[d.getMonth()][t.main]+=t.amount; } })
    return arr
  }, [state.transactions, year])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <NativeSelect className="w-44" value={range} onChange={setRange} options={[
            {value:'year',label:'Anno corrente'},
            {value:'month',label:'Mese specifico'},
            {value:'last3',label:'Ultimi 3 mesi'},
            {value:'last6',label:'Ultimi 6 mesi'},
          ]}/>
          {range==='month' && (
            <NativeSelect className="w-40" value={String(month)} onChange={(v)=>setMonth(Number(v))} options={months.map((m,i)=>({value:String(i),label:m}))}/>
          )}
          <Badge variant="outline" className="rounded-xl">Movimenti: {txInRange.length}</Badge>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {donutData.map(d=>(
          <button key={d.key} onClick={()=>onSelectMain(d.key)} className="text-left">
            <Card style={{borderColor:alpha(d.color,.35)}}>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{background:d.color}}/> {d.name}</div>
                  <div className="text-xs text-slate-500">{nice(d.value)} / {nice(d.budget)}</div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer>
                    <PieChart>
                      <defs>
                        <linearGradient id={`g-${d.key}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={alpha(d.color,.35)} />
                          <stop offset="100%" stopColor={d.color} />
                        </linearGradient>
                      </defs>
                      <Pie isAnimationActive data={[{name:'done', value:d.value}, {name:'left', value:Math.max((d.budget||0)-d.value,0)}]} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        <Cell fill={`url(#g-${d.key})`} /><Cell fill={alpha(d.color,.18)} />
                      </Pie>
                      <Tooltip formatter={(v)=>nice(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {detailMain && <DetailPanel mainKey={detailMain} state={state} year={year} color={MAIN_CATS.find(m=>m.key===detailMain).color} addTx={addTx} />}

      <Card><CardContent>
        <div className="font-medium mb-3">Trend mensile (anno corrente)</div>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#63C4FF" stopOpacity={0.6}/><stop offset="95%" stopColor="#63C4FF" stopOpacity={0}/></linearGradient>
                <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#56E2C6" stopOpacity={0.6}/><stop offset="95%" stopColor="#56E2C6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={.2} />
              <XAxis dataKey="m"/><YAxis/><Tooltip formatter={(v)=>nice(v)}/>
              <Area type="monotone" dataKey="expense" name="Spese" stroke="#63C4FF" fill="url(#g-expense)"/>
              <Area type="monotone" dataKey="income" name="Reddito" stroke="#56E2C6" fill="url(#g-income)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>
    </div>
  )
}

function DetailPanel({ mainKey, state, year, color, addTx }){
  const subcats = state.subcats[mainKey] || []
  const mapBudgets = state.budgets[year] || {}
  const rows = subcats.map(sc=>{
    const key = `${mainKey}:${sc.name}`
    const budget = mapBudgets[key] || 0
    const eff = state.transactions.filter(t=>t.main===mainKey && t.sub===sc.name && new Date(t.date).getFullYear()===Number(year))
                                  .reduce((a,t)=>a+t.amount,0)
    const pct = budget ? Math.min(100, Math.round((eff/budget)*100)) : 0
    return { sub: sc.name, iconKey: sc.iconKey, budget, eff, delta: budget - eff, pct }
  })
  const totals = rows.reduce((a,r)=>({ budget:a.budget+r.budget, eff:a.eff+r.eff }), {budget:0,eff:0})
  const [qaOpen,setQaOpen]=useState(false)
  const [qaSub,setQaSub]=useState(subcats[0]?.name || '')
  const [qaAmt,setQaAmt]=useState(0)
  const [qaDate,setQaDate]=useState(new Date().toISOString().slice(0,10))
  const [qaNote,setQaNote]=useState('')
  useEffect(()=>{ setQaSub(subcats[0]?.name || '') },[mainKey, state.subcats])
  function submitQuick(e){ e?.preventDefault?.(); if(!qaSub) return; addTx({ main:mainKey, sub:qaSub, amount:Number(qaAmt), date:qaDate, note:qaNote }); setQaAmt(0); setQaNote(''); }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{background:color}}/>Dettaglio {MAIN_CATS.find(m=>m.key===mainKey)?.name}</div>
          <Button size="sm" onClick={()=>setQaOpen(v=>!v)} className="rounded-xl"><Plus className="h-4 w-4 mr-2"/>Aggiungi transazione</Button>
        </div>

        {qaOpen && (
          <div className="mb-4 grid md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/30 rounded-xl p-3">
            <div><label className="block text-sm mb-1">Sottocategoria</label><select className="w-full rounded-xl border px-3 py-2" value={qaSub} onChange={(e)=>setQaSub(e.target.value)}>{subcats.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm mb-1">Data</label><input className="w-full rounded-xl border px-3 py-2" type="date" value={qaDate} onChange={(e)=>setQaDate(e.target.value)}/></div>
            <div><label className="block text-sm mb-1">Importo (€)</label><input className="w-full rounded-xl border px-3 py-2" type="number" value={qaAmt} onChange={(e)=>setQaAmt(e.target.value)}/></div>
            <div className="md:col-span-3"><label className="block text-sm mb-1">Note</label><input className="w-full rounded-xl border px-3 py-2" value={qaNote} onChange={(e)=>setQaNote(e.target.value)} placeholder="Facoltativo"/></div>
            <div className="md:col-span-1 flex items-end"><Button className="w-full rounded-xl" onClick={submitQuick}><Plus className="h-4 w-4 mr-2"/>Aggiungi</Button></div>
          </div>
        )}

        <div className="overflow-auto rounded-xl border border-slate-200/20">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="text-left p-2 w-10">Icona</th>
                <th className="text-left p-2">Sottocategoria</th>
                <th className="text-right p-2">Obiettivo</th>
                <th className="text-right p-2">Effettivo</th>
                <th className="text-right p-2">Differenza</th>
                <th className="text-right p-2">% del budget</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.sub} className="border-t border-slate-200/10">
                  <td className="p-2"><IconView name={r.iconKey} color={color}/></td>
                  <td className="p-2">{r.sub}</td>
                  <td className="p-2 text-right">{nice(r.budget)}</td>
                  <td className="p-2 text-right">{nice(r.eff)}</td>
                  <td className={r.delta<0?'p-2 text-right text-red-500':'p-2 text-right text-emerald-500'}>{nice(r.delta)}</td>
                  <td className="p-2 text-right">{r.pct}%</td>
                </tr>
              ))}
              <tr className="border-t border-slate-200/10 font-medium">
                <td className="p-2"></td><td className="p-2">Totale</td>
                <td className="p-2 text-right">{nice(totals.budget)}</td>
                <td className="p-2 text-right">{nice(totals.eff)}</td>
                <td className="p-2 text-right">{nice(totals.budget - totals.eff)}</td>
                <td className="p-2 text-right">{totals.budget? Math.round((totals.eff/totals.budget)*100):0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
