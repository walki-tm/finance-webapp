// src/pages/Categories.jsx
import React, { useState } from 'react';
import { Card, CardContent, Input, Button, Switch } from '../components/ui.jsx';
import { MAIN_CATS } from '../lib/constants.js';
import { Check, X } from 'lucide-react';
import SvgIcon from '../components/SvgIcon.jsx';
import IconBrowserModal from '../components/IconBrowserModal.jsx';

/* Error boundary */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  render(){
    if(this.state.hasError){
      return (
        <div className="p-4 m-4 rounded-xl border border-red-300 bg-red-50 text-red-800">
          <div className="font-bold mb-1">Qualcosa è andato storto in Categories.</div>
          <div className="text-sm whitespace-pre-wrap">{String(this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Utils */
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

function CategoryBadge({ color, children, size = 'md' }) {
  const dark = isDark();
  const pad = size === 'sm' ? 'px-2 py-[3px] text-xs'
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

/* Merge palette */
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

/* Tab 1 — Main */
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

/* Tab 2 — Subcategories */
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
    addSubcat(main, { name: newName, iconKey: 'wallet' }); // deve esistere /public/icons/wallet.svg
    setEditingRow(newName);
  };

  const openIconFor = (subName) => { setIconModalTarget({ subName }); setIconModalOpen(true); };
  const closeIcon = () => { setIconModalOpen(false); setIconModalTarget(null); };

  return (
    <Card>
      <CardContent>
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
                        onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openIconFor(sc.name);
                        }}
                      >
                        <SvgIcon name={sc.iconKey} color={mainColor} size={22} />
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

        <IconBrowserModal
          open={iconModalOpen}
          onClose={closeIcon}
          tintColor={mainColor}
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

/* Pagina */
export default function Categories({
  state,
  addSubcat, updateSubcat, removeSubcat,
  updateMainCat, addMainCat, removeMainCat,
}) {
  const [tab, setTab] = useState('main');

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button variant={tab === 'main' ? 'default' : 'outline'} onClick={() => setTab('main')}>Categorie Main</Button>
          <Button variant={tab === 'subs' ? 'default' : 'outline'} onClick={() => setTab('subs')}>Sottocategorie</Button>
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
    </ErrorBoundary>
  );
}
