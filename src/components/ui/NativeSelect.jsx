import React from 'react';
import { cx } from './cx.js';

export const NativeSelect = ({ className='', options=[], value, onChange }) => (
  <select className={cx('rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm', className)} value={value} onChange={(e)=>onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);