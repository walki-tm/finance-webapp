import React from 'react'
import { motion } from 'framer-motion'

export const cx = (...cls) => cls.filter(Boolean).join(' ')

export const Card = ({ className='', style, children }) => (
  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.22}}>
    <div style={style} className={cx('rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-sm', className)}>{children}</div>
  </motion.div>
)
export const CardContent = ({ className='', children }) => <div className={cx('p-4', className)}>{children}</div>
export const Button = ({ className='', variant='default', size='md', onClick, children, type='button', disabled }) => {
  const variants = {
    default:'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50',
    outline:'border border-slate-300 dark:border-slate-600 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
    ghost:'bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
  }
  const sizes = { md:'px-3 py-2 text-sm', sm:'px-2 py-1 text-xs', icon:'p-2' }
  return <button type={type} onClick={onClick} disabled={disabled} className={cx('rounded-xl transition', variants[variant], sizes[size]||sizes.md, className)}>{children}</button>
}
export const Input = (props) => <input {...props} className={cx('w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm', props.className)} />
export const Label = ({children}) => <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">{children}</label>
export const Badge = ({children, className='', variant='default'}) => {
  const variants = {
    default:'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    secondary:'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    outline:'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
  }
  return <span className={cx('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs', variants[variant], className)}>{children}</span>
}
export const Switch = ({checked, onCheckedChange}) => (
  <button onClick={()=>onCheckedChange(!checked)} className={cx('w-12 h-6 rounded-full relative transition', checked?'bg-sky-500':'bg-slate-400')}>
    <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', checked?'left-6':'left-1')} />
  </button>
)
export const NativeSelect = ({ className='', options=[], value, onChange }) => (
  <select className={cx('rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm', className)} value={value} onChange={(e)=>onChange(e.target.value)}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)
export const NavItem = ({ icon:Icon, label, onClick })=> (<button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"><Icon className="h-4 w-4"/> {label}</button>)
