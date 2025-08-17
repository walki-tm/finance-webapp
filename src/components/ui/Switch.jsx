import React from 'react';
import { cx } from './cx.js';

export const Switch = ({checked, onCheckedChange}) => (
  <button onClick={()=>onCheckedChange(!checked)} className={cx('w-12 h-6 rounded-full relative transition', checked?'bg-sky-500':'bg-slate-400')}>
    <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', checked?'left-6':'left-1')} />
  </button>
);