// src/pages/Categories.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, Input, Button, Switch } from "../components/ui.jsx";
import { MAIN_CATS } from "../lib/constants.js";
import { Check, X, MoreHorizontal, Save, ChevronDown } from "lucide-react";
import SvgIcon from "../components/SvgIcon.jsx";
import IconBrowserModal from "../components/IconBrowserModal.jsx";

/* ---------------- Error boundary ---------------- */
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

/* ---------------- Utils ---------------- */
const isDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

function hexToRgba(hex, a = 1) {
  const h = (hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function toTitleCase(s=""){
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
const CORE_KEYS = new Set(MAIN_CATS.map(m=>m.key));
const CORE_DEFAULT = Object.fromEntries(MAIN_CATS.map(m=>[m.key, {name:m.name, color:m.color}]));

/* Badge categoria (main) */
function CategoryBadge({ color, children, size = "md" }) {
  const dark = isDark();
  const pad =
    size === "sm" ? "px-2 py-[7px] text-xs"
    : size === "lg" ? "px-3 py-2 text-base"
    : "px-2.5 py-1.5 text-sm";
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wide rounded-lg ${pad}`}
      style={{
        backgroundColor: hexToRgba(color, dark ? 0.24 : 0.18),
        color,
        border: `1px solid ${hexToRgba(color, 0.55)}`
      }}
    >
      {children}
    </span>
  );
}

/* Dropdown main custom – SELEZIONA più evidente */
function CustomMainDropdown({ customs = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = customs.find(c => c.key === value) || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="rounded-xl px-3 py-2 min-w-[220px] flex items-center justify-center border-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
        style={{
          borderColor: sel ? sel.color : "rgba(100,116,139,.65)",
          backgroundColor: sel ? hexToRgba(sel.color, 0.14) : (isDark() ? "rgba(148,163,184,.08)" : "#fff")
        }}
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

/* -------- Menu Azioni (⋮) con portal + position:fixed (niente clipping) -------- */
function ActionsMenu({ onEdit, onRemove, onReset, disableRemove=false }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function place() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      // menu largo 176px circa → allineo a destra del bottone
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 176) });
    }
    if (open) {
      place();
      const close = (e) => { if (!(btnRef.current && btnRef.current.contains(e.target))) setOpen(false); };
      const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      document.addEventListener("mousedown", close);
      document.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
        document.removeEventListener("mousedown", close);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="rounded-xl px-2 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => setOpen(o=>!o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Azioni"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && createPortal(
        <div
          className="fixed z-[9999] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
          style={{ top: pos.top, left: pos.left }}
        >
          {onEdit && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={()=>{ setOpen(false); onEdit(); }}
            >
              Modifica
            </button>
          )}
          {onReset && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={()=>{ setOpen(false); onReset(); }}
            >
              Ripristina
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              disabled={disableRemove}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${disableRemove ? "opacity-40 cursor-not-allowed" : "text-rose-600 dark:text-rose-400"}`}
              onClick={()=>{ if(disableRemove) return; setOpen(false); onRemove(); }}
            >
              Rimuovi
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

/* ===================== TAB 1 — Categorie Main ===================== */
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

  // ===== Modifica generale (draft locale) =====
  const [editAll, setEditAll] = useState(false);
  const [draftMap, setDraftMap] = useState({});
  const [editingKey, setEditingKey] = useState(null); // inline row (singola)

  function startEditAll(){
    const init = Object.fromEntries(merged.map(m=>[
      m.key,
      { name: m.name, color: m.color, enabled: m.enabled }
    ]));
    setDraftMap(init);
    setEditAll(true);
    setEditingKey(null);
  }
  function cancelEditAll(){
    setEditAll(false);
    setDraftMap({});
  }
  function saveEditAll(){
    merged.forEach(m=>{
      const draft = draftMap[m.key];
      if (!draft) return;
      const patch = {};
      // nome in maiuscolo
      const upName = (draft.name || "").toUpperCase();
      if (upName !== m.name && m.key !== "income") patch.name = upName;
      if (draft.color !== m.color) patch.color = draft.color;
      if (draft.enabled !== m.enabled && m.key !== "income") patch.enabled = draft.enabled;
      if (Object.keys(patch).length) updateMainCat(m.key, patch);
    });
    setEditAll(false);
    setDraftMap({});
  }

  // ===== Modifica singola (inline) =====
  const [nameDraft, setNameDraft] = useState("");

  function enterRowEdit(m){
    if (editAll) return;
    if (m.key === "income") return; // nome non modificabile
    setEditingKey(m.key);
    setNameDraft(m.name);
  }
  function cancelRowEdit(){
    setEditingKey(null);
  }
  function saveRowEdit(m){
    const nv = nameDraft.trim().toUpperCase();
    if (nv && nv !== m.name) updateMainCat(m.key, { name: nv });
    setEditingKey(null);
  }

  function changeColor(m, val){
    if (editAll){
      setDraftMap(d=>({ ...d, [m.key]: { ...(d[m.key]||{ name:m.name, enabled:m.enabled }), color: val } }));
    } else {
      if (val && val !== m.color) updateMainCat(m.key, { color: val });
    }
  }
  function toggleEnabled(m, v){
    if (m.key === "income") return;
    if (editAll){
      setDraftMap(d=>({ ...d, [m.key]: { ...(d[m.key]||{ name:m.name, color:m.color }), enabled: v } }));
    } else {
      updateMainCat(m.key, { enabled: v });
    }
  }
  function resetCore(m){
    const def = CORE_DEFAULT[m.key];
    if (!def) return;
    if (editAll){
      setDraftMap(d=>({ ...d, [m.key]: { ...(d[m.key]||{}), name: def.name.toUpperCase(), color: def.color } }));
    } else {
      updateMainCat(m.key, { name: def.name.toUpperCase(), color: def.color });
    }
  }

  const headerActions = (
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
            onClick={()=>{
              const tmpKey = `custom_${Date.now().toString(36)}`;
              addMainCat({ key: tmpKey, name: "NUOVA CATEGORIA", color: "#5B86E5" });
              setEditingKey(tmpKey);
              setNameDraft("NUOVA CATEGORIA");
            }}
            className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
          >
            + Aggiungi categoria
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
            <Save className="h-4 w-4"/><span>Salva</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
        <b>Doppio clic</b> per rinominare singolarmente. Clicca il <b>box colore</b> per cambiare tinta.
        In <b>Modifica</b> generale, conferma con <b>Salva</b> in alto.
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Categorie Main</div>
            {headerActions}
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200/20">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-2 py-3">Categoria</th>
                  <th className="text-left px-2 py-3">Nome</th>
                  <th className="text-left px-2 py-3">Colore</th>
                  <th className="text-left px-2 py-3">Visibile</th>
                  <th className="text-left px-2 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-[#444] dark:text-slate-200">
                {merged.map(m => {
                  const draft = editAll ? (draftMap[m.key] || { name:m.name, color:m.color, enabled:m.enabled }) : null;
                  const nameVal = (editAll ? draft.name : m.name) || "";
                  const colorVal = editAll ? draft.color : m.color;
                  const enabledVal = editAll ? draft.enabled : m.enabled;
                  const isIncome = m.key === "income";
                  const isEditing = editingKey === m.key;

                  return (
                    <tr key={m.key} className="border-t border-slate-200/10 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-2 py-3 whitespace-nowrap">
                        <CategoryBadge color={colorVal} size="lg">
                          {nameVal.toUpperCase()}
                        </CategoryBadge>
                      </td>

                      {/* Nome (UPPERCASE) */}
                      <td className="px-2 py-3">
                        {editAll ? (
                          <Input
                            value={nameVal.toUpperCase()}
                            disabled={isIncome}
                            onChange={(e)=> setDraftMap(d=>({ ...d, [m.key]: { ...(d[m.key]||{}), name: e.target.value.toUpperCase() } }))}
                            className={`font-semibold ${isIncome ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              value={nameDraft}
                              onChange={(e)=>setNameDraft(e.target.value.toUpperCase())}
                              onKeyDown={(e)=>{ if(e.key==="Enter") saveRowEdit(m); if(e.key==="Escape") cancelRowEdit(); }}
                              className="font-semibold"
                            />
                            <Button size="sm" onClick={()=>saveRowEdit(m)} className="inline-flex items-center gap-1">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelRowEdit}><X className="h-4 w-4"/></Button>
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${isIncome ? "" : "cursor-text"}`}
                            title={isIncome ? "Il nome non è modificabile" : "Doppio clic per rinominare"}
                            onDoubleClick={()=>enterRowEdit(m)}
                          >
                            {nameVal.toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Colore */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorVal}
                            onChange={(e)=> changeColor(m, e.target.value)}
                            className="h-9 w-12 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                            title="Scegli colore"
                          />
                        </div>
                      </td>

                      {/* Visibile */}
                      <td className="px-2 py-3">
                        {isIncome ? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <Switch
                            checked={!!enabledVal}
                            onCheckedChange={(v)=>toggleEnabled(m, v)}
                            style={!enabledVal ? { filter: isDark() ? "" : "grayscale(40%) opacity(.9)" } : {}}
                          />
                        )}
                      </td>

                      {/* Azioni */}
                      <td className="px-2 py-3">
                        <ActionsMenu
                          onEdit={()=>enterRowEdit(m)}
                          onRemove={!CORE_KEYS.has(m.key) ? ()=>removeMainCat(m.key) : undefined}
                          onReset={CORE_KEYS.has(m.key) ? ()=>resetCore(m) : undefined}
                          disableRemove={CORE_KEYS.has(m.key)}
                        />
                      </td>
                    </tr>
                  );
                })}
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

/* ===================== TAB 2 — Sottocategorie ===================== */
function TabSubcategories({
  state,
  addSubcat = () => {},
  updateSubcat = () => {},
  removeSubcat = () => {},
}) {
  const { core, customs } = getMainPalette(state);

  const [main, setMain] = useState("expense");
  const [customSel, setCustomSel] = useState("");
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [iconModalTarget, setIconModalTarget] = useState(null);

  const mainObj = [...core, ...customs].find(m => m.key === main) || core[0];
  const mainColor = mainObj.color;
  const entries = state.subcats?.[main] || [];

  // ===== Modifica generale (draft locale) =====
  const [editAll, setEditAll] = useState(false);
  const [draftRows, setDraftRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);

  const entriesMemo = useMemo(()=>entries, [entries]);

  function startEditAll(){
    setDraftRows(entriesMemo.map(r=>({ ...r })));
    setEditAll(true);
    setEditingRow(null);
  }
  function cancelEditAll(){
    setEditAll(false);
    setDraftRows([]);
  }
  function saveEditAll(){
    draftRows.forEach(d => {
      const orig = d._origName && d._origName !== d.name ? d._origName : d.name;
      updateSubcat(main, orig, { name: toTitleCase(d.name), iconKey: d.iconKey });
    });
    setEditAll(false);
    setDraftRows([]);
  }

  function addInlineRow(){
    const newName = toTitleCase(`nuova ${entries.length + 1}`);
    if (editAll){
      setDraftRows(rs=>[...rs, { name:newName, iconKey:"wallet" }]);
    } else {
      addSubcat(main, { name:newName, iconKey:"wallet" });
      setEditingRow(newName);
    }
  }

  function openIconFor(subName){
    setIconModalTarget({ subName });
    setIconModalOpen(true);
  }
  const closeIcon = () => { setIconModalOpen(false); setIconModalTarget(null); };

  function setIcon(subName, iconKey){
    if (editAll){
      setDraftRows(rs=>rs.map(r=> r.name===subName ? { ...r, iconKey } : r));
    } else {
      updateSubcat(main, subName, { iconKey });
    }
  }

  function beginRowEdit(sc){
    if (editAll) return;
    setEditingRow(sc.name);
  }
  function cancelRowEdit(){
    setEditingRow(null);
  }
  function saveRowEdit(oldName, inputEl){
    const nv = toTitleCase(inputEl.value.trim());
    if (nv && nv !== oldName) updateSubcat(main, oldName, { name: nv });
    setEditingRow(null);
  }

  const rowsView = editAll ? draftRows : entries;

  return (
    <div className="space-y-4">
      <div className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
        In <b>Modifica</b> generale confermi con <b>Salva</b> in alto. In modifica singola: <b>Enter</b> salva, <b>Esc</b> annulla.
        I nomi vengono sempre in <b>Title Case e grassetto</b>.
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
              <CustomMainDropdown customs={customs} value={customSel} onChange={(k)=>{ setCustomSel(k); if(k) setMain(k); }} />
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
                    <Save className="h-4 w-4"/><span>Salva</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200/20">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-2 py-3 w-12">Icona</th>
                  <th className="text-left px-2 py-3">Nome</th>
                  <th className="text-left px-2 py-3 w-24">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-[#444] dark:text-slate-200">
                {rowsView.map(sc => {
                  const isEditing = !editAll && editingRow === sc.name;
                  const titleName = toTitleCase(sc.name);
                  return (
                    <tr key={sc.name} className="border-t border-slate-200/10 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          title="Cambia icona"
                          className="rounded-lg px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
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

                      <td className="px-2 py-3 align-middle">
                        {editAll ? (
                          <Input
                            value={titleName}
                            onChange={(e)=>{
                              const nv = toTitleCase(e.target.value);
                              setDraftRows(rs=>rs.map(r=>{
                                if (r.name === sc.name) {
                                  return { ...r, name: nv, _origName: r._origName || sc.name };
                                }
                                return r;
                              }));
                            }}
                            className="font-semibold"
                          />
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              defaultValue={titleName}
                              autoFocus
                              onKeyDown={(e)=>{
                                if (e.key === "Enter") saveRowEdit(sc.name, e.currentTarget);
                                if (e.key === "Escape") cancelRowEdit();
                              }}
                              className="font-semibold"
                            />
                            <Button size="sm" onClick={(e)=>saveRowEdit(sc.name, { value: e.currentTarget.parentElement.querySelector('input').value })}><Check className="h-4 w-4"/></Button>
                            <Button size="sm" variant="ghost" onClick={cancelRowEdit}><X className="h-4 w-4"/></Button>
                          </div>
                        ) : (
                          <span className="font-semibold" onDoubleClick={()=>beginRowEdit(sc)} title="Doppio clic per rinominare">
                            {titleName}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-3">
                        {!editAll ? (
                          <ActionsMenu
                            onEdit={()=>beginRowEdit(sc)}
                            onRemove={()=>removeSubcat(main, sc.name)}
                          />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs"></span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rowsView.length === 0 && (
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
              if (!iconModalTarget?.subName) return;
              setIcon(iconModalTarget.subName, key);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== Pagina ===================== */
export default function Categories({
  state,
  addSubcat, updateSubcat, removeSubcat,
  updateMainCat, addMainCat, removeMainCat,
}) {
  const [tab, setTab] = useState("main");

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("main")}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${tab==="main"
                ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white"
                : "border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60"}`}
          >
            Categorie Main
          </button>
          <button
            onClick={() => setTab("subs")}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${tab==="subs"
                ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white"
                : "border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60"}`}
          >
            Sottocategorie
          </button>
        </div>

        {tab === "main" ? (
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
