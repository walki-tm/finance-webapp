/**
 * 📄 BUDGET ROW ACTIONS: Menu azioni per righe budget
 * 
 * 🎯 Scopo: Gestisce le azioni sui budget delle sottocategorie:
 * - "Immetti valore per tutti i mesi" 
 * - "Imposta tutto a 0"
 * 
 * @author Finance WebApp Team
 * @modified 21 Gennaio 2025 - Creazione componente
 */

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Check, X } from 'lucide-react';
import { useToast } from '../../toast';

export default function BudgetRowActions({
  onSetAllMonths,
  onResetAll,
  color = '#64748b',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSetAllInput, setShowSetAllInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, placement: 'bottom' });
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const toast = useToast();

  // ------- UX focus
  useEffect(() => { if (showSetAllInput && inputRef.current) inputRef.current.focus(); }, [showSetAllInput]);

  // ------- Chiudi su click fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowSetAllInput(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------- Calcolo posizione (viewport-based, NO scrollX/scrollY con fixed)
  const computePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const menuWidth = 256; // px
    const winW = window.innerWidth;
    const padding = 8;

    // X: prova a destra del bottone, altrimenti clamp entro viewport
    let x = rect.left; // allinea al bordo sinistro del bottone
    if (x + menuWidth > winW - padding) x = Math.max(padding, winW - menuWidth - padding);

    // Y: default sotto
    let y = rect.bottom + 6;
    let placement = 'bottom';

    // Se il menu è già montato posso misurarne l'altezza per flippare sopra
    const menuH = menuRef.current?.offsetHeight ?? 200; // fallback stima
    if (y + menuH > window.innerHeight - padding) {
      y = Math.max(padding, rect.top - 6 - menuH);
      placement = 'top';
    }

    setMenuPosition({ x, y, placement });
  };

  // ------- Riposiziona quando si apre e ad ogni layout change
  useLayoutEffect(() => {
    if (!isOpen) return;
    // primo posizionamento
    computePosition();
    // ricalcola dopo il paint (per avere altezza reale del menu)
    const raf = requestAnimationFrame(() => computePosition());

    // aggiorna su resize + scroll di QUALSIASI ancestor
    const onResize = () => computePosition();
    const onScroll = () => computePosition();

    window.addEventListener('resize', onResize);
    // use capture=true per intercettare scroll su contenitori annidati
    document.addEventListener('scroll', onScroll, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen]);

  // ------- Azioni
  const handleSetAllMonths = async () => {
    const cleanedValue = inputValue.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanedValue) || 0;
    if (numValue < 0) return toast.error('Il valore non può essere negativo');
    if (numValue >= 10000000) return toast.error('Il valore non può superare i 7 zeri (10 milioni)');
    try {
      const preciseValue = Math.round(numValue * 100) / 100;
      await onSetAllMonths?.(preciseValue);
      setShowSetAllInput(false);
      setInputValue('');
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleResetAll = async () => {
    try { await onResetAll?.(); setIsOpen(false); } catch (e) { console.error(e); }
  };

  const handleSetAllClick = () => { setShowSetAllInput(true); setInputValue(''); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSetAllMonths(); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowSetAllInput(false); setInputValue(''); }
  };

  if (disabled) return null;

  const handleButtonClick = () => {
    setIsOpen((open) => !open);
    // posiziona subito a feedback immediato
    setTimeout(computePosition, 0);
  };

  const MenuContent = () => (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
      role="menu"
      aria-orientation="vertical"
    >
      {!showSetAllInput ? (
        <>
          <button
            onClick={handleSetAllClick}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
            role="menuitem"
          >
            Immetti valore per tutti i mesi
          </button>
          <button
            onClick={handleResetAll}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-600 dark:text-red-400"
            role="menuitem"
          >
            Imposta tutto a 0
          </button>
        </>
      ) : (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci importo"
              autoComplete="off"
            />
            <button onClick={handleSetAllMonths} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Conferma">
              <Check className="h-4 w-4" style={{ color }} />
            </button>
            <button onClick={() => { setShowSetAllInput(false); setInputValue(''); }} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Annulla">
              <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Azioni"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" style={{ color }} />
      </button>
      {isOpen && createPortal(<MenuContent />, document.body)}
    </>
  );
}
