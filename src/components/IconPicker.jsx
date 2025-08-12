// src/components/IconPicker.jsx
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CircleDollarSign, Home, ShoppingCart, Car, Gift, Coffee, Phone, Wifi, Briefcase,
  Building, Wrench, Lightbulb, Gamepad2, Umbrella, Wallet, PiggyBank, CreditCard,
  TrendingDown, TrendingUp
} from 'lucide-react'
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

// Per SVG custom: usa mask-image così li tingiamo con currentColor
const SvgMasked = ({ name, size=16, color='currentColor' }) => (
  <span
    aria-hidden
    style={{
      display:'inline-block',
      width:size, height:size,
      backgroundColor: color,
      WebkitMaskImage: `url(/icons/${name}.svg)`,
      maskImage:       `url(/icons/${name}.svg)`,
      WebkitMaskRepeat:'no-repeat',
      maskRepeat:'no-repeat',
      WebkitMaskPosition:'center',
      maskPosition:'center',
      WebkitMaskSize:'contain',
      maskSize:'contain'
    }}
  />
)

export const IconView = ({ name, color='currentColor', size=16, customIcons }) => {
  // 1) Lucide nativo
  const Lucide = ICONS[name]
  if (Lucide) return <Lucide size={size} style={{ color }} />

  // 2) Emoji o chiave custom nel tuo state
  const customVal = customIcons?.[name]
  if (typeof customVal === 'string') {
    // emoji (1–3 char)
    if (customVal.length <= 3) {
      return <span style={{ color, fontSize: size, lineHeight: 1 }}>{customVal}</span>
    }
    // "svg:nome"
    if (customVal.startsWith('svg:')) {
      const id = customVal.slice(4)
      return <SvgMasked name={id} size={size} color={color} />
    }
  }

  // 3) fallback
  return <CircleDollarSign size={size} style={{ color }} />
}

export default function IconPicker({ value, onChange }){
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({top:0,left:0})

  function openAt(e){
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left })
    setOpen(true)
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openAt} className="flex items-center gap-2">
        <IconView name={value}/> <span className="hidden sm:inline">Icona</span>
      </Button>

      {open && createPortal(
        <div className="fixed z-[9999] w-64 p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-lg grid grid-cols-4 gap-2"
             style={{top:pos.top, left:pos.left}}>
          {ICON_CHOICES.map(i=>(
            <button type="button" key={i.key}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={()=>{ onChange(i.key); setOpen(false); }}>
              <IconView name={i.key}/> <span className="text-xs">{i.label}</span>
            </button>
          ))}
          <div className="col-span-4 text-xs text-slate-500 mt-1">
            Per icone personalizzate usa chiavi tipo <code>svg:nome</code> e metti <code>/public/icons/nome.svg</code>
            oppure usa emoji (es. 🔧).
          </div>
          <button type="button"
            className="absolute -top-2 -right-2 bg-white dark:bg-slate-900 rounded-full border px-2"
            onClick={()=>setOpen(false)}>×</button>
        </div>,
        document.body
      )}
    </>
  )
}
