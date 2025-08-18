import React from 'react';
import { cx } from './cx.js';

export const CardContent = ({ className='', children }) => (
  <div className={cx('p-4', className)}>{children}</div>
);