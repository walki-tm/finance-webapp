/**
 * 📄 BUDGET ROW ACTIONS (focus stabile + UI snappy)
 */
import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback
} from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const toast = useToast();

  // Focus sempre stabile sull'input quando è visibile
  useLayoutEffect(() => {
    if (!showSetAllInput || !inputRef.current) return;
    const el = inputRef.current;
    if (document.activeElement !== el) el.focus();
    // caret alla fine
    const v = el.value; el.setSelectionRange(v.length, v.length);
  }, [showSetAllInput, inputValue]);

  // Chiudi su click fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false); setShowSetAllInput(false); setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Posizionamento: aggiorna stato SOLO se cambia davvero
  const computePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 300, winW = window.innerWidth, padding = 8;

    let x = rect.left;
    if (x + menuWidth > winW - padding) x = Math.max(padding, winW - menuWidth - padding);

    let y = rect.bottom + 6; let placement = 'bottom';
    const menuH = menuRef.current?.offsetHeight ?? 200;
    if (y + menuH > window.innerHeight - padding) { y = Math.max(padding, rect.top - 6 - menuH); placement = 'top'; }

    setMenuPosition(prev => (prev.x !== x || prev.y !== y || prev.placement !== placement)
      ? { x, y, placement } : prev);
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    computePosition();
    const raf = requestAnimationFrame(computePosition);
    const onResize = () => computePosition();
    const onScroll = () => computePosition();
    window.addEventListener('resize', onResize);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen]);

  // --- Input helpers
  const sanitize = (raw) => {
    let s = String(raw ?? '').replace(/[^\d,.-]/g, '').replace(',', '.');
    const parts = s.split('.');
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
    return s;
  };
  const handleChange = (e) => setInputValue(sanitize(e.target.value));
  const handleBeforeInput = (e) => { if (e.data && !/[\d.,-]/.test(e.data)) e.preventDefault(); };

  const commitSetAll = useCallback(() => {
    const cleaned = sanitize(inputValue);
    const n = parseFloat(cleaned);
    const value = Number.isFinite(n) ? n : 0;
    if (value < 0) return toast.error('Il valore non può essere negativo');
    if (value >= 10000000) return toast.error('Il valore non può superare i 7 zeri (10 milioni)');

    // chiudi SUBITO => niente lag percepito
    setShowSetAllInput(false); setInputValue(''); setIsOpen(false);
    setIsProcessing(true);

    // lascia respiro al main thread per il paint
    setTimeout(() => {
      try {
        const precise = Math.round(value * 100) / 100;
        onSetAllMonths?.(precise);
        // Mini loading per 1.5s per feedback visivo
        setTimeout(() => setIsProcessing(false), 1500);
      } catch (e) {
        console.error(e);
        toast.error('Errore durante il salvataggio');
        setIsProcessing(false);
      }
    }, 0);
  }, [inputValue, onSetAllMonths, toast]);

  const commitResetAll = useCallback(() => {
    setIsOpen(false); // chiudi subito
    setIsProcessing(true);
    setTimeout(() => {
      try {
        onResetAll?.();
        // Mini loading per 1.2s per feedback visivo
        setTimeout(() => setIsProcessing(false), 1200);
      }
      catch (e) {
        console.error(e);
        toast.error('Errore durante il reset');
        setIsProcessing(false);
      }
    }, 0);
  }, [onResetAll, toast]);

  const handleKeyDown = useCallback((e) => {
    // evita che keydown bubble rubi il focus (tabella/shortcuts esterni)
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commitSetAll(); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowSetAllInput(false); setInputValue(''); }
  }, [commitSetAll]);

  const handleButtonClick = useCallback(() => {
    setIsOpen(o => !o);
    requestAnimationFrame(computePosition);
  }, []);

  if (disabled) return null;

  const MenuContent = () => (
    <div
      ref={menuRef}
      className="fixed z-50 w-75 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px`, width: '300px' }}
      role="menu"
      aria-orientation="vertical"
      contentEditable={false}
      onMouseDown={(e)=>e.stopPropagation()}
      onKeyDown={(e)=>e.stopPropagation()}
    >
      {!showSetAllInput ? (
        <>
          <button type="button"
            onClick={() => { setShowSetAllInput(true); setInputValue(''); }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
            role="menuitem">
            Immetti valore per tutti i mesi
          </button>
          <button type="button"
            onClick={commitResetAll}
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-600 dark:text-red-400"
            role="menuitem">
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
              onBeforeInput={handleBeforeInput}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci importo"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="button" onClick={commitSetAll}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Conferma">
              <Check className="h-4 w-4" style={{ color }} />
            </button>
            <button type="button" onClick={() => { setShowSetAllInput(false); setInputValue(''); }}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700 transition-colors" title="Annulla">
              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
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
        type="button"
        onClick={handleButtonClick}
        className={`p-1 rounded transition-all duration-200 ${
          isProcessing 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isProcessing ? 'Operazione completata ✓' : 'Azioni'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center w-4 h-4">
            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MoreHorizontal className="h-4 w-4" style={{ color }} />
        )}
      </button>
      {isOpen && createPortal(<MenuContent />, document.body)}
    </>
  );
}
