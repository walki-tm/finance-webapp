import React from 'react';
import { cx } from './cx.js';

export const Badge = ({children, className='', variant='default'}) => {
  const variants = {
    default:'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    secondary:'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    outline:'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200',
  };
  return <span className={cx('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs', variants[variant], className)}>{children}</span>;
};