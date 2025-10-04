// src/features/transactions/components/TransactionModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, AlertCircle, StickyNote, ChevronDown, TrendingUp, ShoppingCart, CreditCard, PiggyBank, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import { MAIN_CATS } from '../../../lib/constants.js';
import SvgIcon from '../../icons/components/SvgIcon.jsx';
import { formatDateForAPI, getTodayDate } from '../../../lib/dateUtils.js';
import { getAccountIcon } from '../../../lib/accountIcons.js';
import { useAccounts } from '../../accounts';
import { useAuth } from '../../../context/AuthContext';

/* ===== utils ===== */
function hexToRgba(hex, a = 1) {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

function useDropdown(onClose) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) { setOpen(false); onClose?.(); }
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return { open, setOpen, ref };
}

/* mappa icone per le 4 core */
const CORE_MAIN_ICONS = {
  income: TrendingUp,
  expense: ShoppingCart,
  debt: CreditCard,
  saving: PiggyBank,
};

/* ===== CategorySelect: mostra anche icone + rispetta 'enabled' ===== */
const CategorySelect = React.memo(({ value, onChange, mains = [] }) => {
  const dark = isDark();

  // pool = merge passato dal parent, altrimenti MAIN_CATS
  const POOL = Array.isArray(mains) && mains.length > 0 ? mains : MAIN_CATS;
  // nascondi main con enabled === false
  const LIST = POOL.filter(m => m.enabled !== false);

  // selezionata o fallback
  const selected =
    LIST.find(c => c.key === value) ||
    LIST[0] ||
    { key: 'expense', name: 'SPESE', color: '#5B86E5' };

  const { open, setOpen, ref } = useDropdown();
  const mainColor = selected.color;

  // Memoizza stili per evitare ricreazione
  const buttonStyle = useMemo(() => ({
    borderColor: hexToRgba(mainColor, 0.55),
    backgroundColor: hexToRgba(mainColor, dark ? 0.16 : 0.12)
  }), [mainColor, dark]);

  // se la main corrente sparisce dai visibili, spostati sulla prima disponibile
  useEffect(() => {
    if (!LIST.some(c => c.key === value) && LIST[0]) onChange?.(LIST[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LIST.map(c => `${c.key}:${c.enabled !== false}`).join('|')]);

  const RenderMainChip = React.memo(({ m }) => {
    const chipStyle = useMemo(() => ({
      backgroundColor: hexToRgba(m.color, dark ? 0.24 : 0.18),
      color: m.color,
      border: `1px solid ${hexToRgba(m.color, 0.55)}`
    }), [m.color, dark]);
    
    return (
      <span
        className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
        style={chipStyle}
      >
        {m.name}
      </span>
    );
  });

  const chevronStyle = useMemo(() => ({ color: mainColor }), [mainColor]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-2 py-2 text-sm border focus:outline-none flex items-center justify-between"
        style={buttonStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <RenderMainChip m={selected} />
        <ChevronDown className="h-4 w-4" style={chevronStyle} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {LIST.map((c) => (
              <li
                key={c.key}
                role="option"
                onClick={() => { onChange(c.key); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RenderMainChip m={c} />
              </li>
            ))}
            {LIST.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">Nessuna categoria visibile</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

/* ===== SubcatSelect: bolla con icona svg e testo tinto dalla main ===== */
function SubcatSelect({ value, onChange, options = [], color }) {
  const selected = options.find(s => s.name === value) || options[0] || { name: '—' };
  const { open, setOpen, ref } = useDropdown();
  const dark = isDark();

  const IconBubble = ({ iconKey }) => (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: 22, height: 22,
        border: `2px solid ${color}`,
        color
      }}
    >
      <SvgIcon name={iconKey} size={14} color={color} iconType="sub" />
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <IconBubble iconKey={selected.iconKey} />
          <span className="font-semibold" style={{ color: dark ? '#ffffff' : color }}>
            {selected.name}
          </span>
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {options.map((s) => (
              <li
                key={s.name}
                role="option"
                onClick={() => { onChange(s.name); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="inline-flex items-center gap-2" style={{ color: dark ? '#ffffff' : color }}>
                  <IconBubble iconKey={s.iconKey} />
                  <span className="font-semibold">{s.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== Componente Label Account per evitare errori React ===== */
const AccountLabel = React.memo(({ transactionType }) => {
  if (transactionType === 'transfer') {
    return 'Da conto'
  }
  if (transactionType === 'income') {
    return (
      <span>
        Conto <span className="text-emerald-600 ml-1">(riceve)</span>
      </span>
    )
  }
  if (transactionType === 'expense') {
    return (
      <span>
        Conto <span className="text-red-600 ml-1">(addebita)</span>
      </span>
    )
  }
  return 'Conto'
})

/* ===== Tipologie transazione ===== */
const TRANSACTION_TYPES = {
  income: {
    key: 'income',
    name: 'Entrata',
    icon: ArrowDownCircle,
    color: '#10b981',
    description: 'Denaro che entra in un conto'
  },
  expense: {
    key: 'expense', 
    name: 'Uscita',
    icon: ArrowUpCircle,
    color: '#ef4444',
    description: 'Denaro che esce da un conto'
  }
  // ✅ REMOVED: transfer type - now handled by separate TransferModal
};

/* ===== Account Layout Components ===== */
const TransferAccountsLayout = React.memo(({ 
  accountId, 
  setAccountId, 
  destinationAccountId, 
  setDestinationAccountId, 
  availableAccounts, 
  destinationAccounts,
  transactionType 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" key="transfer-layout">
    <div>
      <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">
        <AccountLabel transactionType={transactionType} />
      </label>
      <AccountSelect
        value={accountId}
        onChange={setAccountId}
        accounts={availableAccounts}
        placeholder="Seleziona conto origine"
      />
    </div>
    
    <div>
      <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">
        A conto <span className="text-emerald-600">(riceve)</span>
      </label>
      <AccountSelect
        value={destinationAccountId}
        onChange={setDestinationAccountId}
        accounts={destinationAccounts}
        placeholder="Seleziona conto destinazione"
      />
    </div>
  </div>
))

const SingleAccountLayout = React.memo(({ 
  accountId, 
  setAccountId, 
  availableAccounts, 
  transactionType 
}) => (
  <div className="grid grid-cols-1 gap-3" key="single-layout">
    <div>
      <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">
        <AccountLabel transactionType={transactionType} />
      </label>
      <AccountSelect
        value={accountId}
        onChange={setAccountId}
        accounts={availableAccounts}
        placeholder="Seleziona conto"
      />
    </div>
  </div>
))

/* ===== AccountSelect: Dropdown per selezione conto ===== */
function AccountSelect({ value, onChange, accounts = [], placeholder = "Seleziona conto" }) {
  const { open, setOpen, ref } = useDropdown();
  const dark = isDark();
  
  const selected = accounts.find(acc => acc.id === value);
  
  const AccountItem = ({ account, isSelected = false }) => {
    const accountIconConfig = getAccountIcon(account.accountType || account.type);
    const IconComponent = accountIconConfig.icon;
    
    return (
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: hexToRgba(account.colorHex || account.color, 0.2),
            border: `1px solid ${hexToRgba(account.colorHex || account.color, 0.3)}`
          }}
        >
          <IconComponent 
            className="h-4 w-4" 
            style={{ color: account.colorHex || account.color }}
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 dark:text-white">
            {account.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {accountIconConfig.label} • €{Number(account.balance || 0).toFixed(2)}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <AccountItem account={selected} isSelected />
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            {placeholder}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {accounts.map((account) => (
              <li
                key={account.id}
                role="option"
                onClick={() => { onChange(account.id); setOpen(false); }}
                className={`px-3 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  account.id === value ? 'bg-sky-50 dark:bg-sky-900/20' : ''
                }`}
              >
                <AccountItem account={account} />
              </li>
            ))}
            {accounts.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                Nessun conto disponibile
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== Modale Aggiungi/Modifica transazione ===== */
export default function TransactionModal({
  open,
  onClose,
  onSave,
  subcats,
  /** mains opzionale: array unito core+custom, con { key, name, color, enabled, iconKey? } */
  mains = [],
  initial = null,
}) {
  if (!open) return null;
  
  // Ottieni token JWT dall'AuthContext
  const { token } = useAuth();
  
  // Carica conti tramite hook
  const { accounts = [] } = useAccounts(token);
  
  // Determina il tipo di transazione dall'initial se presente
  const getInitialTransactionType = () => {
    if (initial?.main === 'income') return 'income';
    // All other transaction types default to expense
    return 'expense';
  };

  // stato form principale
  const [transactionType, setTransactionType] = useState(getInitialTransactionType());
  const [main, setMain] = useState(initial?.main || 'expense');
  const [sub, setSub] = useState(initial?.sub || '');
  const [date, setDate] = useState(initial?.date ? formatDateForAPI(new Date(initial.date)) : formatDateForAPI(getTodayDate()));
  const [amount, setAmount] = useState(initial?.amount != null ? Math.abs(Number(initial.amount)) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [showNote, setShowNote] = useState(Boolean(initial?.note));
  const [error, setError] = useState('');
  
  // stato conti
  const [accountId, setAccountId] = useState(initial?.accountId || '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  
  // Filtro conti disponibili per tipo di transazione
  const availableAccounts = useMemo(() => {
    return accounts.filter(account => {
      // Per entrate/uscite, escludi solo eventuali conti inattivi se presenti
      return account.isActive !== false;
    });
  }, [accounts, transactionType]);
  
  // Filtra conti destinazione (escludi conto di origine)
  const destinationAccounts = useMemo(() => {
    return availableAccounts.filter(acc => acc.id !== accountId);
  }, [availableAccounts, accountId]);

  // Effetto per sincronizzare transactionType con main
  useEffect(() => {
    // Per entrate/uscite, usa la categoria tradizionale
    if (transactionType === 'income' && main !== 'income') {
      setMain('income');
    } else if (transactionType === 'expense' && main === 'income') {
      setMain('expense');
    }
  }, [transactionType, main]);

  // lista sub per la main scelta
  const listForMain = useMemo(() => {
    return subcats?.[main] || [];
  }, [subcats, main, transactionType]);

  // quando cambio main, allinea la sub
  useEffect(() => {
    if (!listForMain.find(s => s.name === sub)) setSub(listForMain[0]?.name || '');
  }, [listForMain, sub]);

  // colore main corrente (anche custom)
  const mainColor = useMemo(() => {
    const pool = (Array.isArray(mains) && mains.length > 0) ? mains : MAIN_CATS;
    return pool.find(m => m.key === main)?.color || '#94a3b8';
  }, [mains, main, transactionType]);

  function submit(e) {
    e?.preventDefault?.();
    setError('');
    const a = Number(amount);
    
    // Validazione per entrate/uscite (transfers now handled by separate modal)
    if (!sub || !accountId || !date || isNaN(a) || a <= 0) {
      setError('Compila tutti i campi obbligatori e usa un importo > 0.');
      return;
    }
    
    // Prepara i dati per il salvataggio
    const transactionData = {
      transactionType,
      main,
      sub,
      date,
      amount: Math.abs(a), // Always positive, sign handled by transactionType
      note: note.trim(),
      accountId
    };
    
    onSave(transactionData);
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {initial ? 'Modifica transazione' : 'Aggiungi transazione'}
            </h3>
            <button
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
          </div>

          {/* form */}
          <form onSubmit={submit} className="p-5 space-y-4">
            {/* TIPO TRANSAZIONE */}
            <div>
              <label className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-200">
                Tipo transazione
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(TRANSACTION_TYPES).map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = transactionType === type.key;
                  
                  // Stili memoizzati per evitare ricreazione
                  const buttonClassName = isSelected 
                    ? 'p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-105 border-current shadow-lg'
                    : 'p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-105 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
                  
                  const buttonStyle = useMemo(() => ({
                    color: isSelected ? type.color : undefined,
                    backgroundColor: isSelected ? hexToRgba(type.color, 0.1) : undefined
                  }), [isSelected, type.color]);
                  
                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setTransactionType(type.key)}
                      className={buttonClassName}
                      style={buttonStyle}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs font-semibold">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEZIONE CONTI */}
            <SingleAccountLayout
              accountId={accountId}
              setAccountId={setAccountId}
              availableAccounts={availableAccounts}
              transactionType={transactionType}
            />

            {/* CATEGORIA E SOTTOCATEGORIA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">Categoria</label>
                  <CategorySelect value={main} onChange={setMain} mains={mains} />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">Sottocategoria</label>
                  <SubcatSelect
                    value={sub}
                    onChange={setSub}
                    options={listForMain}
                    color={mainColor}
                  />
                </div>
              </div>

            {/* DATA E IMPORTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-semibold text-slate-700 dark:text-slate-200">Importo (€)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* NOTA (toggle) */}
            {!showNote && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowNote(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700
                 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <StickyNote className="h-4 w-4" />
                  Aggiungi nota
                </button>
              </div>
            )}
            {showNote && (
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 font-semibold">Nota</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Aggiungi una nota"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm
                 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* ERRORE */}
            {error && (
              <div className="md:col-span-2 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/40 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* AZIONI */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={
                  !date || !amount || Number(amount) <= 0 || !accountId || !sub
                }
                className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white
                           hover:opacity-90 disabled:opacity-50"
              >
                {initial ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
