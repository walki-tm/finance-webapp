import React from 'react';
import { cx } from './cx.js';

export const Input = (props) => (
  <input {...props} className={cx('w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm', props.className)} />
);