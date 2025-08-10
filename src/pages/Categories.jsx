import React, { useState } from 'react'
import { Card, CardContent, Label, Input, Button } from '../components/ui.jsx'
import IconPicker, { IconView } from '../components/IconPicker.jsx'
import { MAIN_CATS } from '../lib/constants.js'

function CustomIconForm({ onAdd }){
  const [key,setKey]=useState('custom1')
  const [emoji,setEmoji]=useState('🔥')
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div><Label>Nome (chiave)</Label><Input value={key} onChange={(e)=>setKey(e.target.value)}/></div>
      <div><Label>Emoji/Carattere</Label><Input value={emoji} onChange={(e)=>setEmoji(e.target.value)} /></div>
      <Button onClick={()=> key && emoji && onAdd(key, emoji)}>Aggiungi</Button>
    </div>
  )
}

export default function Categories({ state, addSubcat, updateSubcat, removeSubcat, addCustomIcon }){
  const [tab,setTab]=useState('gestione')
  const [main,setMain]=useState('expense')
  const [name,setName]=useState('')
  const [iconKey,setIconKey]=useState('cart')

  const entries = state.subcats[main] || []
  const mainColor = MAIN_CATS.find(m=>m.key===main)?.color

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={tab==='gestione'?'default':'outline'} onClick={()=>setTab('gestione')}>Sottocategorie</Button>
        <Button variant={tab==='custom'?'default':'outline'} onClick={()=>setTab('custom')}>Icone Custom</Button>
      </div>

      {tab==='gestione' ? (
        <>
          <Card><CardContent>
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div><Label>Categoria principale</Label>
                <select className="w-full rounded-xl border px-3 py-2" value={main} onChange={(e)=>setMain(e.target.value)}>
                  {MAIN_CATS.map(m=><option key={m.key} value={m.key}>{m.name}</option>)}
                </select>
              </div>
              <div><Label>Nome sottocategoria</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Es. Benzina"/></div>
              <div className="flex items-end gap-2">
                <div><Label>Icona</Label><IconPicker value={iconKey} onChange={setIconKey}/></div>
                <Button onClick={()=>{ if(name.trim()){ addSubcat(main,{name:name.trim(),iconKey}); setName(''); } }} className="rounded-xl ml-auto">Aggiungi</Button>
              </div>
            </div>
          </CardContent></Card>

          <Card><CardContent>
            <div className="font-medium mb-3">Sottocategorie {MAIN_CATS.find(m=>m.key===main)?.name}</div>
            <div className="overflow-auto rounded-xl border border-slate-200/20">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="text-left p-2 w-10">Icona</th><th className="text-left p-2">Nome</th><th className="text-left p-2">Azioni</th></tr></thead>
                <tbody>
                  {entries.map(sc=>(
                    <tr key={sc.name} className="border-t border-slate-200/10">
                      <td className="p-2"><IconView name={sc.iconKey} color={mainColor} customIcons={state.customIcons}/></td>
                      <td className="p-2">{sc.name}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <IconPicker value={sc.iconKey} onChange={(val)=>updateSubcat(main, sc.name, { iconKey: val })}/>
                          <Button variant="outline" size="sm" onClick={()=>{ const nv=prompt('Rinomina', sc.name); if(nv && nv!==sc.name) updateSubcat(main, sc.name, { name: nv }); }}>Rinomina</Button>
                          <Button variant="ghost" size="sm" onClick={()=>removeSubcat(main, sc.name)}>Rimuovi</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {entries.length===0 && (<tr><td className="p-4 text-center text-slate-500" colSpan={3}>Nessuna sottocategoria</td></tr>)}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </>
      ) : (
        <Card><CardContent className="space-y-3">
          <div className="font-medium">Aggiungi icona custom</div>
          <p className="text-sm text-slate-500">Usa un’emoji o un singolo carattere (es. 🔧, 🏠, 🛒). Sarà selezionabile nel Picker.</p>
          <CustomIconForm onAdd={addCustomIcon} />
          <div className="text-sm">Icone attuali: {Object.entries(state.customIcons).length===0? 'nessuna' :
            Object.entries(state.customIcons).map(([k,v])=>(<span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border mr-2 text-xs"><span>{v}</span><span>{k}</span></span>))}
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}
