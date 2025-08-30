import React, { useMemo, useState } from "react";
import { Card, CardContent, Input, Button } from "../../ui";
import { Save, Check, X, ChevronDown, GripVertical } from "lucide-react";
import { useToast } from "../../toast";
import SvgIcon from "../../icons/components/SvgIcon.jsx";
import IconBrowserModal from "../components/IconBrowserModal.jsx";
import CategoryBadge, { isDark } from "../components/CategoryBadge.jsx";
import ActionsMenu from "../components/ActionsMenu.jsx";
import { MAIN_CATS } from "../../../lib/constants.js";

function toTitleCase(s = "") {
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function CustomMainDropdown({ customs = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = customs.find(c => c.key === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`rounded-xl px-3 py-2 min-w-[220px] flex items-center justify-center border-2 transition
              bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800
              ${sel ? '' : 'border-slate-400/70'}
  `}
        style={sel ? { borderColor: sel.color, backgroundColor: hexToRgba(sel.color, isDark() ? 0.14 : 0.1) } : {}}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {sel ? (
          <CategoryBadge color={sel.color}>{sel.name}</CategoryBadge>
        ) : (
          <span className="text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <ChevronDown className="h-4 w-4 opacity-80" />
            SELEZIONA
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
          <button
            type="button"
            className="w-full text-center px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            onClick={() => { onChange(""); setOpen(false); }}
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

function hexToRgba(hex, a = 1) {
  const h = (hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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

export default function SubCategoriesTab({ state, addSubcat = () => {}, updateSubcat = () => {}, removeSubcat = () => {}, reorderSubcats = () => {} }) {
  const toast = useToast();
  const { core, customs } = getMainPalette(state);

  const [main, setMain] = useState("expense");
  const [customSel, setCustomSel] = useState("");
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconModalTarget, setIconModalTarget] = useState(null);

  const mainObj = [...core, ...customs].find(m => m.key === main) || core[0];
  const mainColor = mainObj.color;
  const entries = state.subcats?.[main] || [];

  function subNameExists(name, exceptId = null) {
    const u = (name || "").trim().toLowerCase();
    return entries.some(sc => sc.id !== exceptId && (sc.name || "").trim().toLowerCase() === u);
  }

  const [editAll, setEditAll] = useState(false);
  const [draftRows, setDraftRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);

  // Drag & Drop state
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [preview, setPreview] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const entriesMemo = useMemo(() => entries, [entries]);

  function startEditAll() {
    setDraftRows(entriesMemo.map(r => ({ ...r })));
    setEditAll(true);
    setEditingRowId(null);
  }
  function cancelEditAll() {
    setEditAll(false);
    setDraftRows([]);
  }
  function saveEditAll() {
    const names = new Set();
    for (const d of draftRows) {
      const nm = (d.name || "").trim().toUpperCase();
      if (names.has(nm)) { toast.error("Sottocategorie duplicate nelle modifiche."); return; }
      names.add(nm);
    }
    draftRows.forEach(d => {
      if (!d.id) return;
      updateSubcat(main, d.id, { name: toTitleCase(d.name), iconKey: d.iconKey });
    });
    setEditAll(false);
    setDraftRows([]);
  }

  function addInlineRow() {
    let base = `Nuova ${entries.length + 1}`;
    let candidate = toTitleCase(base);
    let i = 2;
    while (subNameExists(candidate)) { candidate = toTitleCase(`${base} (${i++})`); }
    if (editAll) {
      setDraftRows(rs => [...rs, { name: candidate, iconKey: "wallet" }]);
    } else {
      addSubcat(main, { name: candidate, iconKey: "wallet" })
        .then((created) => {
          if (created?.id) setEditingRowId(created.id);
          toast.success("Sottocategoria creata");
        })
        .catch(e => toast.error("Errore creazione sottocategoria", { description: String(e.message || e) }));
    }
  }

  function openIconFor(subId) {
    setIconModalTarget({ subId });
    setIconModalOpen(true);
  }
  const closeIcon = () => { setIconModalOpen(false); setIconModalTarget(null); };

  function setIcon(subId, iconKey) {
    if (editAll) {
      setDraftRows(rs => rs.map(r => r.id === subId ? { ...r, iconKey } : r));
    } else {
      updateSubcat(main, subId, { iconKey });
    }
  }

  function beginRowEdit(sc) {
    if (editAll) return;
    setEditingRowId(sc.id);
  }
  function cancelRowEdit() {
    setEditingRowId(null);
  }
  function saveRowEdit(subId, inputEl) {
    const nv = toTitleCase((inputEl.value || "").trim());
    if (!nv) { setEditingRowId(null); return; }
    if (subNameExists(nv, subId)) {
      toast.error("Nome sottocategoria duplicato", { description: `"${nv}" esiste già.` });
      return;
    }
    updateSubcat(main, subId, { name: nv })
      .then(() => toast.success("Sottocategoria aggiornata"))
      .catch(e => toast.error("Errore aggiornamento", { description: String(e.message || e) }));
    setEditingRowId(null);
  }

  const rowsView = editAll ? draftRows : entries;
  const rowsSorted = useMemo(() => {
    const arr = [...rowsView];
    // Ordina per sortOrder se presente, altrimenti per nome
    arr.sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return arr;
  }, [rowsView]);

  const displayedRows = preview ?? rowsSorted;

  return (
    <div className="space-y-4">
          <div className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
        In <b>Modifica</b> generale confermi con <b>Salva</b> in alto. In modifica singola: <b>Enter</b> salva, <b>Esc</b> annulla.
        I nomi vengono sempre in <b>Title Case</b>.
      </div>
      
      <div className="mb-3 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
        Suggerimento: trascina le carte per riordinare (disponibile fuori da "Modifica" generale).
      </div>

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
                    onClick={() => { setMain(m.key); setCustomSel(""); }}
                    className={`rounded-lg transition-transform ${selected ? "" : "hover:opacity-90"}`}
                    style={{ transform: selected ? "scale(1.06)" : "scale(1)" }}
                  >
                    <CategoryBadge color={m.color} size="lg">
                      {m.name.toUpperCase()}
                    </CategoryBadge>
                  </button>
                );
              })}
              <CustomMainDropdown customs={customs} value={customSel} onChange={(k) => { setCustomSel(k); if (k) setMain(k); }} />
            </div>

            <div className="flex items-center gap-2">
              {!editAll ? (
                <>
                  <button
                    onClick={startEditAll}
                    className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={addInlineRow}
                    className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
                  >
                    + Aggiungi sottocategoria
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelEditAll}
                    className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={saveEditAll}
                    className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 inline-flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" /><span>Salva</span>
                  </button>
                </>
              )}
            </div>
          </div>

          
          {/* Modern card-style layout */}
          <div className="space-y-3">
            {displayedRows.map((sc, idx) => {
              const isEditing = !editAll && editingRowId === sc.id;
              const titleName = toTitleCase(sc.name);
              
              // Calculate background and border colors using main category color with alternating pattern
              const isEven = idx % 2 === 0;
              const baseOpacity = isEven ? '06' : '10'; // Alternate between 6% and 10% opacity
              const bgColor = `${mainColor}${baseOpacity}`;
              const borderColor = `${mainColor}30`; // 30% opacity
              const hoverBg = overIdx === idx ? `${mainColor}15` : bgColor;
              
              return (
                <div
                  key={sc.id || sc.name}
                  className={`
                    group relative rounded-xl transition-all duration-300 p-3
                    border-2 shadow-sm hover:shadow-md
                    ${overIdx === idx ? 'border-opacity-60 shadow-md' : 'border-opacity-40'}
                  `}
                  style={{
                    backgroundColor: hoverBg,
                    borderColor,
                    boxShadow: overIdx === idx 
                      ? `0 10px 25px -5px ${mainColor}25, 0 10px 10px -5px ${mainColor}15`
                      : `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
                  }}
                  onMouseEnter={(e) => {
                    if (overIdx !== idx) {
                      e.currentTarget.style.boxShadow = `0 10px 25px -5px ${mainColor}20, 0 10px 10px -5px ${mainColor}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (overIdx !== idx) {
                      e.currentTarget.style.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`;
                    }
                  }}
                  onDragOver={(e) => {
                    if (editAll || savingOrder) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragIdx === null) return;
                    if (idx === dragIdx) return;
                    const base = preview ?? rowsSorted;
                    const newOrder = [...base];
                    const [moved] = newOrder.splice(dragIdx, 1);
                    newOrder.splice(idx, 0, moved);
                    setPreview(newOrder);
                    setOverIdx(idx);
                    setDragIdx(idx);
                  }}
                  onDrop={async (e) => {
                    if (editAll || savingOrder) return;
                    e.preventDefault();
                    const finalOrder = (preview ?? rowsSorted).map(r => r.id).filter(Boolean);
                    if (finalOrder.length) {
                      try {
                        setSavingOrder(true);
                        await reorderSubcats(main, finalOrder);
                      } catch (err) {
                        // Errore gestito dall'optimistic update rollback
                      } finally {
                        setSavingOrder(false);
                      }
                    }
                    setPreview(null);
                    setDragIdx(null);
                    setOverIdx(null);
                  }}
                  onDragEnd={(e) => { 
                    // Always reset transformations immediately
                    const card = e.currentTarget;
                    card.style.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`;
                    card.style.transform = '';
                    card.style.zIndex = '';
                    
                    if (!savingOrder) { 
                      setPreview(null); 
                      setDragIdx(null); 
                      setOverIdx(null); 
                    } 
                  }}
                  onDragLeave={() => { setOverIdx(null); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          title="Trascina per riordinare"
                          draggable={!editAll}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(idx));
                            e.dataTransfer.effectAllowed = 'move';
                            setDragIdx(idx);
                            setOverIdx(idx);
                            setPreview(displayedRows);
                            // Add stronger shadow during drag
                            const card = e.currentTarget.closest('.group');
                            card.style.boxShadow = `0 15px 30px -8px ${mainColor}35, 0 15px 15px -8px ${mainColor}20`;
                            card.style.transform = 'scale(1.02) rotate(0.5deg)';
                            card.style.zIndex = '1000';
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-200"
                        >
                          <GripVertical className="h-4 w-4 opacity-60" />
                        </span>
                        <button
                          type="button"
                          title="Cambia icona"
                          className="rounded-xl px-3 py-2 hover:bg-white/80 dark:hover:bg-slate-900/80 flex items-center justify-center transition-colors"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openIconFor(sc.id);
                          }}
                        >
                          <SvgIcon name={sc.iconKey} color={mainColor} size={24} iconType="sub" />
                        </button>
                      </div>

                      <div className="flex-1">
                        {editAll ? (
                          <Input
                            value={titleName}
                            onChange={(e) => {
                              const nv = toTitleCase(e.target.value);
                              setDraftRows(rs => rs.map(r => {
                                if (r.id === sc.id) {
                                  return { ...r, name: nv };
                                }
                                return r;
                              }));
                            }}
                            className="text-sm bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-600"
                          />
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              defaultValue={titleName}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRowEdit(sc.id, e.currentTarget);
                                if (e.key === "Escape") cancelRowEdit();
                              }}
                              className="text-sm bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-600"
                            />
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => saveRowEdit(sc.id, { value: e.currentTarget.parentElement.querySelector('input').value })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={cancelRowEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:underline" 
                            onDoubleClick={() => beginRowEdit(sc)} 
                            title="Doppio clic per rinominare"
                          >
                            {titleName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <ActionsMenu
                        onEdit={() => beginRowEdit(sc)}
                        onRemove={async () => {
                          const ok = await removeSubcat(main, sc.id);
                          if (!ok) toast.error("Impossibile rimuovere la sottocategoria");
                        }}
                      />
                    </div>
                  </div>
                </div>
                  );
                })}
                {rowsSorted.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-lg font-medium mb-2">Nessuna sottocategoria</div>
                    <div className="text-sm">Aggiungi la prima sottocategoria per iniziare</div>
                  </div>
                )}
          </div>

          <IconBrowserModal
            open={iconModalOpen}
            onClose={closeIcon}
            tintColor={mainColor}
            onPick={(key) => {
              if (!iconModalTarget?.subId) return;
              setIcon(iconModalTarget.subId, key);
            }}
            iconType="sub"
          />
        </CardContent>
      </Card>
    </div>
  );
}