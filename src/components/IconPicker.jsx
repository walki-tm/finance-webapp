import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleDollarSign, Home, ShoppingCart, Car, Gift, Coffee, Phone, Wifi, Briefcase, Building, Wrench, Lightbulb, Gamepad2, Umbrella, Wallet, PiggyBank, CreditCard, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from './ui.jsx'

export const ICONS = {
  home: Home, cart: ShoppingCart, car: Car, gift: Gift, coffee: Coffee, phone: Phone,
  wifi: Wifi, briefcase: Briefcase, building: Building, wrench: Wrench, bulb: Lightbulb,
  gamepad: Gamepad2, umbrella: Umbrella, money: CircleDollarSign, wallet: Wallet,
  piggy: PiggyBank, card: CreditCard, spend: TrendingDown, earn: TrendingUp
}
export const ICON_CHOICES = [
  {key:'home',label:'Casa'},{key:'cart',label:'Spesa'},{key:'car',label:'Auto'},{key:'gift',label:'Regali'},
  {key:'coffee',label:'Bar'},{key:'phone',label:'Telefono'},{key:'wifi',label:'Internet'},{key:'briefcase',label:'Lavoro'},
  {key:'building',label:'Affitto'},{key:'wrench',label:'Manutenzione'},{key:'bulb',label:'Luce'},{key:'gamepad',label:'Svago'},
  {key:'umbrella',label:'Assicurazione'},{key:'money',label:'Finanza'},{key:'wallet',label:'Portafoglio'},{key:'piggy',label:'Risparmi'},
  {key:'card',label:'Carta'},{key:'spend',label:'Spese'},{key:'earn',label:'Reddito'},
]

export const IconView = ({ name, color, customIcons }) => {
  const Lucide = ICONS[name]
  if (Lucide) return <Lucide className="h-4 w-4" style={{color}} />
  const emoji = customIcons?.[name]
  if (emoji) return <span style={{color, fontSize:14, lineHeight:1}}>{emoji}</span>
  return <CircleDollarSign className="h-4 w-4" style={{color}} />
}

export default function IconPicker({ value, onChange }){
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({top:0,left:0})
  function openAt(e){ const r=e.currentTarget.getBoundingClientRect(); setPos({top:r.bottom+4,left:r.left}); setOpen(true) }
  return (
    <>
      <Button variant="outline" size="sm" onClick={openAt} className="flex items-center gap-2">
        <IconView name={value}/> <span className="hidden sm:inline">Icona</span>
      </Button>
      {open && createPortal(
        <div className="fixed z-[9999] w-64 p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-lg grid grid-cols-4 gap-2"
             style={{top:pos.top, left:pos.left}}>
          {ICON_CHOICES.map(i=>(
            <button key={i.key} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={()=>{ onChange(i.key); setOpen(false); }}>
              <IconView name={i.key}/> <span className="text-xs">{i.label}</span>
            </button>
          ))}
          <div className="col-span-4 text-xs text-slate-500 mt-1">Oppure aggiungi icone custom nella scheda “Icone Custom”.</div>
          <button className="absolute -top-2 -right-2 bg-white dark:bg-slate-900 rounded-full border px-2" onClick={()=>setOpen(false)}>×</button>
        </div>, document.body
      )}
    </>
  )
}
