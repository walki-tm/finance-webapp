import { Wallet, TrendingDown, CreditCard, PiggyBank } from 'lucide-react'

export const MAIN_CATS = [
  { key:'income',  name:'REDDITO', color:'#56E2C6', icon: Wallet, iconKey: 'fi-income' },
  { key:'expense', name:'SPESE',   color:'#63C4FF', icon: TrendingDown, iconKey: 'fi-expense' },
  { key:'debt',    name:'DEBITI',  color:'#FF4DA2', icon: CreditCard, iconKey: 'fi-bank' },
  { key:'saving',  name:'RISPARMI',color:'#FFD34E', icon: PiggyBank, iconKey: 'fi-piggy' },
]

export const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
