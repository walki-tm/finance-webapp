import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, Input, Button, Switch } from '../components/ui.jsx';
import { MAIN_CATS } from '../lib/constants.js';
import { Check, X } from 'lucide-react';

// --- Mini icon renderer (indipendente dal Picker) ---
import {
  CircleDollarSign, Home, ShoppingCart, Car, Gift, Coffee, Phone, Wifi, Briefcase,
  Building, Wrench, Lightbulb, Gamepad2, Umbrella, Wallet, PiggyBank, CreditCard,
  TrendingDown, TrendingUp
} from 'lucide-react';

const ICONS = {
  home: Home, cart: ShoppingCart, car: Car, gift: Gift, coffee: Coffee, phone: Phone,
  wifi: Wifi, briefcase: Briefcase, building: Building, wrench: Wrench, bulb: Lightbulb,
  gamepad: Gamepad2, umbrella: Umbrella, money: CircleDollarSign, wallet: Wallet,
  piggy: PiggyBank, card: CreditCard, spend: TrendingDown, earn: TrendingUp
};

function MiniIcon({ name, color, size = 22, customIcons }) {
  const Lucide = ICONS[name];
  if (Lucide) return <Lucide style={{ color, width: size, height: size }} />;
  const emoji = customIcons?.[name];
  if (emoji) return <span style={{ color, fontSize: size, lineHeight: 1 }}>{emoji}</span>;
  return <CircleDollarSign style={{ color, width: size, height: size }} />;
}

/* ===== Utils colore ===== */
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

/* ===== Libreria icone base (chiavi di MiniIcon) ===== */
const DEFAULT_ICON_KEYS = [
  'home','cart','car','gift','coffee','phone','wifi','briefcase','building','wrench',
  'bulb','gamepad','umbrella','money','wallet','piggy','card','spend','earn'
];

/* ===== Unione main core + override + custom ===== */
function getMainPalette(state) {
  const coreMap = Object.fromEntries(MAIN_CATS.map(m => [m.key, { ...m, core: true }]));
  for (const o of (state.customMainCats || [])) {
    if (coreMap[o.key]) coreMap[o.key] = { ...coreMap[o.key], ...o };
  }
  const core = Object.values(coreMap);
  const customs = (state.customMainCats || [])
    .filter(c => !coreMap[c.key])
    .map(c => ({ ...c, core: false }));
  return { core, customs, all: [...core, ...customs] };
}

/* ===== Badge categoria (stile Transactions) ===== */
function CategoryBadge({ color, children, size = 'md' }) {
  const dark = isDark();
  const pad =
    size === 'sm' ? 'px-2 py-[3px] text-xs'
    : size === 'lg' ? 'px-3 py-1.5 text-base'
    : 'px-2.5 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wide rounded-lg ${pad}`}
      style={{
        backgroundColor: hexToRgba(color, dark ? 0.22 : 0.16),
        color: color,
        border: `1px solid ${hexToRgba(color, 0.55)}`
      }}
    >
      {children}
    </span>
  );
}

/* ===== Dropdown categorie main custom (placeholder “SELEZIONA”) ===== */
function CustomMainDropdown({ customs = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = customs.find(c => c.key === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="rounded-xl px-3 py-2 border min-w-[220px] flex items-center justify-center"
        style={{
          borderColor: sel ? sel.color : 'rgba(148,163,184,.4)',
          backgroundColor: sel ? hexToRgba(sel.color, 0.16) : (isDark() ? 'rgba(148,163,184,.10)' : '#f8fafc')
        }}
      >
        {sel ? (
          <CategoryBadge color={sel.color}>{sel.name}</CategoryBadge>
        ) : (
          <span className="text-xs font-semibold tracking-wide text-slate-500">SELEZIONA</span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
          <button
            type="button"
            className="w-full text-center px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            SELEZIONA
          </button>
          {customs.map(c => (
            <button
              type="button"
              key={c.key}
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => { onChange(c.key); setOpen(false); }}
            >
              <CategoryBadge color={c.color}>{c.name}</CategoryBadge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Modale icone: griglia quadrati, tinta main (montata su document.body) ===== */
function IconBrowserModal({ open, onClose, onPick, tintColor = '#0b1220', customIcons = {} }) {
  const [q, setQ] = useState('');
  if (!open) return null;

  const builtin = useMemo(
    () => DEFAULT_ICON_KEYS.filter(k => k.toLowerCase().includes(q.toLowerCase())),
    [q]
  );
  const customEntries = useMemo(() => {
    const arr = Object.entries(customIcons || {}); // [key, emoji|svgKey]
    return q ? arr.filter(([k]) => k.toLowerCase().includes(q.toLowerCase())) : arr;
  }, [q, customIcons]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (key) => { onPick(key); onClose(); };

  const Tile = ({ children, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      title={label}
    >
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          width: 56, height: 56,
          backgroundColor: hexToRgba(tintColor, isDark() ? 0.12 : 0.10)
        }}
      >
        <div style={{ color: tintColor }}>
          {children}
        </div>
      </div>
      <div className="text-xs opacity-70">{label}</div>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* header */}
          <div className="px-5 py-4 border-b border-slate-200/10 flex items-center justify-between">
            <div className="font-semibold text-slate-900 dark:text-white">Seleziona icona</div>
            <div className="w-64">
              <Input placeholder="Cerca per nome..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {/* body */}
          <div className="p-5 space-y-6">
            <section>
              <div className="text-sm mb-2 text-slate-500 dark:text-slate-300">Libreria</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {builtin.map(key => (
                  <Tile key={key} label={key} onClick={() => pick(key)}>
                    <MiniIcon name={key} color={tintColor} size={28} />
                  </Tile>
                ))}
              </div>
            </section>

            {customEntries.length > 0 && (
              <section>
                <div className="text-sm mb-2 text-slate-500 dark:text-slate-300">Custom</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {customEntries.map(([key, emojiOrKey]) => (
                    <Tile key={key} label={key} onClick={() => pick(key)}>
                      {typeof emojiOrKey === 'string' && emojiOrKey.length <= 3
                        ? <div style={{ fontSize: 28, lineHeight: 1 }}>{emojiOrKey}</div>
                        : <MiniIcon name={key} color={tintColor} size={28} />
                      }
                    </Tile>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* footer */}
          <div className="px-5 pb-5 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Chiudi</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   TAB 1 — Categorie Main (editor colore fisso + Salva icona)
   ========================================================= */
function TabMainCategories({ state, updateMainCat, addMainCat, removeMainCat }) {
  const core = MAIN_CATS.map(m => ({ ...m, core: true }));
  const overridesMap = Object.fromEntries((state.customMainCats || []).map(c => [c.key, c]));
  const effectiveCore = core.map(m => ({ ...m, ...(overridesMap[m.key] || {}) }));
  const customOnly = (state.customMainCats || [])
    .filter(c => !core.some(m => m.key === c.key))
    .map(c => ({ ...c, core: false }));

  const merged = [...effectiveCore, ...customOnly].map(m => ({
    ...m,
    enabled: state.mainEnabled?.[m.key] !== false,
  }));

  const usedColors = new Set(merged.map(m => (m.color || '').toLowerCase()));
  const colorUsed = (c, current) => {
    const low = (c || '').toLowerCase();
    if (!low) return false;
    if (current && current.toLowerCase() === low) return false;
    return usedColors.has(low);
  };

  const [editingColor, setEditingColor] = useState(null);
  const [draftColor, setDraftColor] = useState('#5B86E5');

  const startEditColor = (key, current) => { setEditingColor(key); setDraftColor(current || '#5B86E5'); };
  const cancelEditColor = () => setEditingColor(null);
  const saveEditColor = (m) => {
    const c = draftColor;
    if (colorUsed(c, m.color)) { alert('Colore già in uso.'); return; }
    if (c && c !== m.color) updateMainCat(m.key, { color: c });
    setEditingColor(null);
  };

  const handleAddRow = () => {
    const tmpKey = `custom_${Date.now().toString(36)}`;
    addMainCat({ key: tmpKey, name: 'Nuova categoria', color: '#5B86E5' });
    setEditingColor(tmpKey);
    setDraftColor('#5B86E5');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Categorie Main</div>
            <Button onClick={handleAddRow}>+ Aggiungi categoria</Button>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200/20">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Colore</th>
                  <th className="text-left p-2">Visibile</th>
                  <th className="text-left p-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {merged.map(m => (
                  <tr key={m.key} className="border-t border-slate-200/10">
                    <td className="p-2 whitespace-nowrap">
                      <CategoryBadge color={m.color} size="lg">{m.name}</CategoryBadge>
                    </td>

                    <td className="p-2">
                      <Input
                        defaultValue={m.name}
                        className="font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const nv = e.currentTarget.value.trim();
                            if (nv && nv !== m.name) updateMainCat(m.key, { name: nv });
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const nv = e.target.value.trim();
                          if (nv && nv !== m.name) updateMainCat(m.key, { name: nv });
                        }}
                      />
                    </td>

                    <td className="p-2">
                      {editingColor === m.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={draftColor}
                            onChange={(e) => setDraftColor(e.target.value)}
                            className="h-9 w-14 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                            title="Scegli colore"
                          />
                          <Button size="sm" onClick={() => saveEditColor(m)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditColor}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded border" style={{ backgroundColor: m.color, borderColor: hexToRgba(m.color, .5) }} />
                          <Button variant="outline" size="sm" onClick={() => startEditColor(m.key, m.color)}>
                            Modifica
                          </Button>
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(v) => updateMainCat(m.key, { enabled: v })}
                      />
                    </td>

                    <td className="p-2">
                      {!m.core && (
                        <Button variant="ghost" size="sm" onClick={() => removeMainCat(m.key)}>
                          Rimuovi
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {merged.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nessuna categoria</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================
   TAB 2 — Sottocategorie (icone medie, tinte main)
   ========================================================= */
function TabSubcategories({
  state,
  addSubcat = () => {},
  updateSubcat = () => {},
  removeSubcat = () => {},
}) {
  const { core, customs } = getMainPalette(state);

  const [main, setMain] = useState('expense');
  const [customSel, setCustomSel] = useState('');
  const [editAll, setEditAll] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconModalTarget, setIconModalTarget] = useState(null);

  const mainObj = [...core, ...customs].find(m => m.key === main) || core[0];
  const mainColor = mainObj.color;
  const entries = state.subcats?.[main] || [];

  const selectCore = (key) => { setMain(key); setCustomSel(''); };
  const selectCustom = (key) => { setCustomSel(key); if (key) setMain(key); };

  const addInlineRow = () => {
    const newName = `Nuova ${entries.length + 1}`;
    addSubcat(main, { name: newName, iconKey: 'cart' });
    setEditingRow(newName);
  };

  const openIconFor = (subName) => { setIconModalTarget({ subName }); setIconModalOpen(true); };
  const closeIcon = () => { setIconModalOpen(false); setIconModalTarget(null); };

  return (
    <Card>
      <CardContent>
        {/* selettori + azioni */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex flex-wrap items-center gap-3">
            {core.map(m => {
              const selected = m.key === main;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => selectCore(m.key)}
                  className="rounded-lg transition-transform"
                  style={{ transform: selected ? 'scale(1.08)' : 'scale(1)' }}
                >
                  <CategoryBadge color={m.color} size="lg">{m.name}</CategoryBadge>
                </button>
              );
            })}
            <CustomMainDropdown customs={customs} value={customSel} onChange={selectCustom} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant={editAll ? 'default' : 'outline'} onClick={() => setEditAll(v => !v)}>
              {editAll ? 'Blocca modifica' : 'Modifica'}
            </Button>
            <Button onClick={addInlineRow}>+ Aggiungi sottocategoria</Button>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-slate-200/20">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="text-left p-2 w-10">Icona</th>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(sc => {
                const isEditing = editAll || editingRow === sc.name;
                return (
                  <tr key={sc.name} className="border-t border-slate-200/10">
                    <td className="p-2">
                      <button
                        type="button"
                        title="Cambia icona"
                        className="rounded-lg px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => openIconFor(sc.name)}
                      >
                        <MiniIcon name={sc.iconKey} color={mainColor} size={22} customIcons={state.customIcons} />
                      </button>
                    </td>
                    <td className="p-2">
                      {isEditing ? (
                        <Input
                          defaultValue={sc.name}
                          autoFocus={editingRow === sc.name}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nv = e.currentTarget.value.trim();
                              if (nv && nv !== sc.name) updateSubcat(main, sc.name, { name: nv });
                              setEditingRow(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingRow(null);
                              e.currentTarget.blur();
                            }
                          }}
                          onBlur={(e) => {
                            const nv = e.target.value.trim();
                            if (nv && nv !== sc.name) updateSubcat(main, sc.name, { name: nv });
                            setEditingRow(null);
                          }}
                          className="font-bold"
                        />
                      ) : (
                        <span className="font-bold">{sc.name}</span>
                      )}
                    </td>

                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        {!editAll && (
                          <Button variant="outline" size="sm" onClick={() => setEditingRow(sc.name)}>
                            Modifica
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => removeSubcat(main, sc.name)}>
                          Rimuovi
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr><td className="p-4 text-center text-slate-500" colSpan={3}>Nessuna sottocategoria</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODALE ICONE: griglia quadrati, tinta main */}
        <IconBrowserModal
          open={iconModalOpen}
          onClose={closeIcon}
          tintColor={mainColor}
          customIcons={state.customIcons}
          onPick={(key) => {
            if (iconModalTarget?.subName) {
              updateSubcat(main, iconModalTarget.subName, { iconKey: key });
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

/* ===== Pagina Categorie (2 tab) ===== */
export default function Categories({
  state,
  addSubcat, updateSubcat, removeSubcat,
  updateMainCat, addMainCat, removeMainCat,
}) {
  const [tab, setTab] = useState('main'); // 'main' | 'subs'

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={tab === 'main' ? 'default' : 'outline'} onClick={() => setTab('main')}>
          Categorie Main
        </Button>
        <Button variant={tab === 'subs' ? 'default' : 'outline'} onClick={() => setTab('subs')}>
          Sottocategorie
        </Button>
      </div>

      {tab === 'main' ? (
        <TabMainCategories
          state={state}
          updateMainCat={updateMainCat}
          addMainCat={addMainCat}
          removeMainCat={removeMainCat}
        />
      ) : (
        <TabSubcategories
          state={state}
          addSubcat={addSubcat}
          updateSubcat={updateSubcat}
          removeSubcat={removeSubcat}
        />
      )}
    </div>
  );
}
