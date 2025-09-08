import React from 'react';
import { cx } from './cx.js';

export const Button = React.forwardRef(({ className='', variant='default', size='md', onClick, children, type='button', disabled }, ref) => {
  const variants = {
    default:'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50',
    outline:'border border-slate-300 dark:border-slate-600 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
    ghost:'bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60',
  };
  const sizes = { md:'px-3 py-2 text-sm', sm:'px-2 py-1 text-xs', icon:'p-2' };
  return (
    <button ref={ref} type={type} onClick={onClick} disabled={disabled} className={cx('rounded-xl transition', variants[variant], sizes[size]||sizes.md, className)}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
