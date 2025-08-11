import React, { useMemo, useState } from 'react';
import { Card, CardContent, Label, Input, Button, NativeSelect, Switch } from '../components/ui.jsx';
import IconPicker, { IconView } from '../components/IconPicker.jsx';
import { MAIN_CATS } from '../lib/constants.js';

/* ---------- Utils colore ---------- */
function hexToRgba(hex, a = 1) {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function contrastText(hex) {
  const h = (hex || '#94a3b8').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#0b1220' : '#ffffff';
}
const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

/* ---------- Catalogo icone base (chiavi compatibili con <IconView/>) ---------- */
const DEFAULT_ICON_KEYS = [
  'home', 'cart', 'car', 'gift', 'coffee', 'phone', 'wifi', 'briefcase', 'building', 'wrench',
  'bulb', 'gamepad', 'umbrella', 'money', 'wallet', 'piggy', 'card', 'spend', 'earn'
];

/* ---------- Modale grande per scegliere icone (con ricerca) ---------- */
function IconBrowserModal({ open, onClose, onPick, customIcons = {} }) {
  const [q, setQ] = useState('');
  if (!open) return null;
  const dark = isDark();

  const builtin = useMemo(
    () => DEFAULT_ICON_KEYS.filter(k => k.toLowerCase().includes(q.toLowerCase())),
    [q]
  );
  const customEntries = useMemo(() => {
    const arr = Object.entries(customIcons || {}); // [key, emoji]
    return q ? arr.filter(([k]) => k.toLowerCase().includes(q.toLowerCase())) : arr;
  }, [q, customIcons]);

  const Cell = ({ children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay separato: click qui chiude */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* dialog: impedisce che il click buchi sull’overlay */}
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl pointer-events-auto">
          <div className="px-5 py-4 border-b border-slate-200/10 flex items-center justify-between">
            <div className="font-semibold text-slate-900 dark:text-white">Seleziona icona</div>
            <div className="w-64"><Input placeholder="Cerca per nome..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>

          <div className="p-5 space-y-6">
            <section>
              <div className="text-sm mb-2 text-slate-500 dark:text-slate-300">Libreria</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {builtin.map(key => (
                  <Cell key={key} onClick={() => { onPick(key); }}>
                    <IconView name={key} color={dark ? '#ffffff' : '#0b1220'} customIcons={{}} />
                    <div className="text-xs opacity-70">{key}</div>
                  </Cell>
                ))}
              </div>
            </section>

            {customEntries.length > 0 && (
              <section>
                <div className="text-sm mb-2 text-slate-500 dark:text-slate-300">Custom</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {customEntries.map(([key, emoji]) => (
                    <Cell key={key} onClick={() => { onPick(key); }}>
                      <div className="text-2xl">{emoji}</div>
                      <div className="text-xs opacity-70">{key}</div>
                    </Cell>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="px-5 pb-5 flex justify-end">
            <Button variant="outline" onClick={onClose}>Chiudi</Button>
          </div>
        </div>
      </div>
    </div>
  );
}



/* ---------- Badge categoria (stile coerente) ---------- */
function CategoryBadge({ color, children }) {
  const dark = isDark();
  const text = dark ? '#ffffff' : (contrastText(color) === '#ffffff' ? '#ffffff' : '#0b1220');
  return (
    <span
      className="inline-flex items-center font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
      style={{
        backgroundColor: hexToRgba(color, dark ? 0.28 : 0.18),
        color: text,
        border: `1px solid ${color}`
      }}
    >
      {children}
    </span>
  );
}

/* ============= Helpers merge main (core + custom/override) ============= */
function useMergedMain(mainCustomArray, mainEnabled) {
  return useMemo(() => {
    const map = new Map();
    MAIN_CATS.forEach((m) => map.set(m.key, { ...m, core: true }));
    (mainCustomArray || []).forEach((c) => {
      map.set(c.key, { ...(map.get(c.key) || {}), ...c, core: Boolean(map.get(c.key)?.core) });
    });
    return Array.from(map.values()).map(m => ({
      ...m,
      enabled: mainEnabled?.[m.key] !== false
    }));
  }, [mainCustomArray, mainEnabled]);
}

/* merge main: core + override (stesso key) + custom aggiuntive */
function getMainPalette(state) {
  // base core
  const coreMap = Object.fromEntries(MAIN_CATS.map(m => [m.key, { ...m, core: true }]));
  // override su core (nome/colore) se presenti in customMainCats con lo stesso key
  for (const o of (state.customMainCats || [])) {
    if (coreMap[o.key]) coreMap[o.key] = { ...coreMap[o.key], ...o };
  }
  // array core aggiornato
  const core = Object.values(coreMap);
  // solo custom “pure” (key non core)
  const customs = (state.customMainCats || []).filter(c => !coreMap[c.key]).map(c => ({ ...c, core: false }));
  return { core, customs, all: [...core, ...customs] };
}

/* ======================= TAB 1 — Categorie Main ======================= */
function TabMainCategories({
  state,
  updateMainCat, addMainCat, removeMainCat
}) {
  const merged = useMergedMain(state.customMainCats, state.mainEnabled);
  const usedColors = new Set(merged.map(m => (m.color || '').toLowerCase()));
  const [justAddedKey, setJustAddedKey] = useState(null);

  const colorUsed = (c, current) => {
    const low = (c || '').toLowerCase();
    if (current && current.toLowerCase() === low) return false;
    return usedColors.has(low);
  };

  function handleAddRow() {
    const key = `custom_${Date.now().toString(36)}`;
    // aggiungo subito nel global state (come richiesto: niente form separato)
    addMainCat({ key, name: 'Nuova categoria', color: '#5B86E5' });
    setJustAddedKey(key);
  }

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
                      <CategoryBadge color={m.color}>{m.name}</CategoryBadge>
                    </td>

                    {/* Nome inline: Enter => blur => salva */}
                    <td className="p-2">
                      <Input
                        defaultValue={m.name}
                        autoFocus={m.key === justAddedKey}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
                        onBlur={(e) => {
                          const nv = e.target.value.trim();
                          if (nv && nv !== m.name) updateMainCat(m.key, { name: nv });
                        }}
                      />
                    </td>

                    {/* Colore: controllo duplicati; Enter => blur */}
                    <td className="p-2">
                      <input
                        type="color"
                        defaultValue={m.color}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
                        onBlur={(e) => {
                          const c = e.target.value;
                          if (!c) return;
                          if (colorUsed(c, m.color)) { alert('Colore già in uso.'); e.target.value = m.color; return; }
                          if (c !== m.color) updateMainCat(m.key, { color: c });
                        }}
                        className="h-9 w-16 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                        title="Scegli colore"
                      />
                    </td>

                    {/* Enabled */}
                    <td className="p-2">
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(v) => updateMainCat(m.key, { enabled: v })}
                      />
                    </td>

                    {/* Azioni */}
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

function CustomMainDropdown({ customs = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = customs.find(c => c.key === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="rounded-xl px-2 py-1 border flex items-center gap-2"
        style={{
          borderColor: sel ? sel.color : 'rgba(148,163,184,.4)',
          backgroundColor: sel ? hexToRgba(sel.color, 0.14) : (isDark() ? 'rgba(148,163,184,.10)' : '#f8fafc')
        }}
      >
        <span className="text-xs opacity-70">{sel ? 'Custom:' : ''}</span>
        <span
          className="inline-flex items-center font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
          style={{
            backgroundColor: sel ? hexToRgba(sel.color, 0.22) : 'transparent',
            color: sel ? (contrastText(sel.color) === '#ffffff' ? '#fff' : '#0b1220') : (isDark() ? '#e2e8f0' : '#475569'),
            border: sel ? `1px solid ${sel.color}` : '1px dashed rgba(148,163,184,.5)'
          }}
        >
          {sel ? sel.name : '— categorie aggiuntive —'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
          <button
            className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            Nessuna
          </button>
          {customs.map(c => (
            <button
              key={c.key}
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => { onChange(c.key); setOpen(false); }}
            >
              <span
                className="inline-flex items-center font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
                style={{ backgroundColor: hexToRgba(c.color, 0.22), color: (contrastText(c.color) === '#ffffff' ? '#fff' : '#0b1220'), border: `1px solid ${c.color}` }}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   TAB 2 — Sottocategorie
   - Badge cliccabili per le 4 main core
   - Dropdown per main custom (con badge colore)
   - Quando selezioni una core → dropdown torna vuoto
   - Titolo con badge della main corrente
   - Modifica inline singola o “Modifica tutto”
   - Popup icone funzionante
   ========================================================= */
function TabSubcategories({
  state,
  addSubcat = () => { },
  updateSubcat = () => { },
  removeSubcat = () => { },
}) {
  const { core, customs } = getMainPalette(state);

  const [main, setMain] = useState('expense');   // key main corrente (core o custom)
  const [customSel, setCustomSel] = useState(''); // key custom selezionata nel dropdown
  const [editAll, setEditAll] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconModalTarget, setIconModalTarget] = useState(null);

  const mainObj = [...core, ...customs].find(m => m.key === main) || core[0];
  const mainColor = mainObj.color;
  const entries = state.subcats?.[main] || [];

  // selezione core → evidenzia + resetta dropdown custom
  const selectCore = (key) => { setMain(key); setCustomSel(''); };

  // selezione custom → imposta main su quella
  const selectCustom = (key) => {
    setCustomSel(key);
    if (key) setMain(key);
  };

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
        {/* header del card: selettori + azioni */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          {/* core badges */}
          <div className="flex flex-wrap items-center gap-2">
            {core.map(m => {
              const selected = m.key === main;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => selectCore(m.key)}
                  className="rounded-lg px-2 py-1 border transition-transform"
                  style={{
                    borderColor: m.color,
                    backgroundColor: hexToRgba(m.color, selected ? 0.24 : 0.12),
                    color: isDark() ? '#fff' : (contrastText(m.color) === '#ffffff' ? '#fff' : '#0b1220'),
                    fontWeight: 700,
                    transform: selected ? 'scale(1.06)' : 'scale(1)'
                  }}
                >
                  {m.name}
                </button>
              );
            })}

            {/* dropdown custom con badge nel trigger */}
            <CustomMainDropdown customs={customs} value={customSel} onChange={selectCustom} />
          </div>

          {/* azioni */}
          <div className="flex items-center gap-2">
            <Button variant={editAll ? 'default' : 'outline'} onClick={() => setEditAll(v => !v)}>
              {editAll ? 'Blocca modifica' : 'Modifica'}
            </Button>
            <Button onClick={addInlineRow}>+ Aggiungi sottocategoria</Button>
          </div>
        </div>

        {/* tabella stessa card */}
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
                    {/* icona (apre popup) */}
                    <td className="p-2">
                      <button
                        type="button"
                        title="Cambia icona"
                        className="rounded-lg px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => openIconFor(sc.name)}
                      >
                        <IconView name={sc.iconKey} color={mainColor} customIcons={state.customIcons} />
                      </button>
                    </td>

                    {/* nome inline */}
                    <td className="p-2">
                      {isEditing ? (
                        <Input
                          defaultValue={sc.name}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          onBlur={(e) => {
                            const nv = e.target.value.trim();
                            if (nv && nv !== sc.name) updateSubcat(main, sc.name, { name: nv });
                            setEditingRow(null);
                          }}
                          autoFocus={editingRow === sc.name}
                        />
                      ) : (
                        sc.name
                      )}
                    </td>

                    {/* azioni riga */}
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

        {/* popup icone */}
        <IconBrowserModal
          open={iconModalOpen}
          onClose={closeIcon}
          customIcons={state.customIcons}
          onPick={(key) => {
            if (iconModalTarget?.subName) {
              updateSubcat(main, iconModalTarget.subName, { iconKey: key });
            }
            closeIcon();
          }}
        />
      </CardContent>
    </Card>
  );
}



/* ======================= PAGINA CATEGORIE (2 TAB) ======================= */
export default function Categories({
  state,
  // sottocategorie
  addSubcat, updateSubcat, removeSubcat,
  // main (persistenza globale)
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
