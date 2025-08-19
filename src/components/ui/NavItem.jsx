import React from 'react';

export const NavItem = ({ icon:Icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800">
    <Icon className="h-4 w-4"/> {label}
  </button>
);