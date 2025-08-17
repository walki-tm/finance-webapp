import React from 'react';
import { motion } from 'framer-motion';
import { cx } from './cx.js';

export const Card = ({ className='', style, children }) => (
  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.22}}>
    <div style={style} className={cx('rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-sm', className)}>
      {children}
    </div>
  </motion.div>
);