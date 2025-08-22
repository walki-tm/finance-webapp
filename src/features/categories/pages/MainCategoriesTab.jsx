import React, { useState } from "react";
import { Card, CardContent, Input, Button, Switch } from "../../ui";
import { MAIN_CATS } from "../../../lib/constants.js";
import { Check, X, Save } from "lucide-react";
import { useToast } from "../../toast";
import ColorPicker from "../components/ColorPicker.jsx";
import CategoryBadge, { isDark } from "../components/CategoryBadge.jsx";
import ActionsMenu from "../components/ActionsMenu.jsx";

const CORE_KEYS = new Set(MAIN_CATS.map(m => m.key));
const CORE_DEFAULT = Object.fromEntries(MAIN_CATS.map(m => [m.key, { name: m.name, color: m.color }]));

export default function MainCategoriesTab({ state, updateMainCat, addMainCat, removeMainCat }) {
  const toast = useToast();
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

  function mainNameExists(UPPER_NAME, exceptKey = null) {
    const u = (UPPER_NAME || "").trim().toUpperCase();
    return merged.some(m => m.key !== exceptKey && (m.name || "").trim().toUpperCase() === u);
  }
  function uniqueMainName(base = "NUOVA CATEGORIA") {
    const baseUp = (base || "").trim().toUpperCase();
    if (!mainNameExists(baseUp)) return baseUp;
    let n = 2;
    while (mainNameExists(`${baseUp} (${n})`)) n++;
    return `${baseUp} (${n})`;
  }

  const [editAll, setEditAll] = useState(false);
  const [draftMap, setDraftMap] = useState({});
  const [editingKey, setEditingKey] = useState(null);

  function startEditAll() {
    const init = Object.fromEntries(merged.map(m => [
      m.key,
      { name: m.name, color: m.color, enabled: m.enabled }
    ]));
    setDraftMap(init);
    setEditAll(true);
    setEditingKey(null);
  }
  function cancelEditAll() {
    setEditAll(false);
    setDraftMap({});
  }
  function saveEditAll() {
    const seen = new Set();
    for (const k of Object.keys(draftMap)) {
      const n = (draftMap[k]?.name || "").trim().toUpperCase();
      if (!n) continue;
      if (seen.has(n) || mainNameExists(n, k)) {
        toast.error("Nome categoria duplicato", { description: `La categoria "${n}" esiste già.` });
        return;
      }
      seen.add(n);
    }
    merged.forEach(m => {
      const draft = draftMap[m.key];
      if (!draft) return;
      const patch = {};
      const upName = (draft.name || "").toUpperCase();
      if (upName !== m.name) patch.name = upName;
      if (draft.color !== m.color) patch.color = draft.color;
      const isCore = CORE_KEYS.has(m.key);
      if (!isCore && draft.enabled !== m.enabled) patch.visible = draft.enabled;

      if (Object.keys(patch).length) {
        updateMainCat(m.key, patch).catch(e => {
          toast.error("Errore salvataggio categoria", { description: String(e.message || e) });
        });
      }
    });
    setEditAll(false);
    setDraftMap({});
    toast.success("Categorie aggiornate");
  }

  const [nameDraft, setNameDraft] = useState("");

  function enterRowEdit(m) {
    if (editAll) return;
    setEditingKey(m.key);
    setNameDraft(m.name);
  }
  function cancelRowEdit() {
    setEditingKey(null);
  }
  function saveRowEdit(m) {
    const nv = nameDraft.trim().toUpperCase();
    if (!nv || nv === m.name) { setEditingKey(null); return; }
    if (mainNameExists(nv, m.key)) {
      toast.error("Nome categoria duplicato", { description: `"${nv}" esiste già.` });
      return;
    }
    updateMainCat(m.key, { name: nv })
      .then(() => toast.success("Categoria aggiornata"))
      .catch(e => toast.error("Errore aggiornamento", { description: String(e.message || e) }));
    setEditingKey(null);
  }

  function changeColor(m, val) {
    if (editAll) {
      setDraftMap(d => ({ ...d, [m.key]: { ...(d[m.key] || { name: m.name, enabled: m.enabled }), color: val } }));
    } else {
      if (val && val !== m.color) {
        updateMainCat(m.key, { color: val })
          .catch(e => toast.error("Errore colore", { description: String(e.message || e) }));
      }
    }
  }
  function toggleEnabled(m, v) {
    if (CORE_KEYS.has(m.key)) return;
    if (editAll) {
      setDraftMap(d => ({ ...d, [m.key]: { ...(d[m.key] || { name: m.name, color: m.color }), enabled: v } }));
    } else {
      updateMainCat(m.key, { visible: v })
        .catch(e => toast.error("Errore visibilità", { description: String(e.message || e) }));
    }
  }
  function resetCore(m) {
    const def = CORE_DEFAULT[m.key];
    if (!def) return;
    const payload = { name: def.name.toUpperCase(), color: def.color, visible: true };
    if (editAll) {
      setDraftMap(d => ({ ...d, [m.key]: { ...(d[m.key] || {}), ...payload } }));
    } else {
      updateMainCat(m.key, payload)
        .then(() => toast.success("Ripristinata ai valori di default"))
        .catch(e => toast.error("Errore ripristino", { description: String(e.message || e) }));
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
            onClick={async () => {
              const key = `custom_${Date.now().toString(36)}`;
              const name = uniqueMainName("NUOVA CATEGORIA");
              try {
                await addMainCat({ key, name, color: "#5B86E5" });
                setEditingKey(key);
                setNameDraft(name);
                toast.success("Categoria creata");
              } catch (e) {
                toast.error("Errore creazione categoria", { description: String(e.message || e) });
              }
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
            <Save className="h-4 w-4" /><span>Salva</span>
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

          {/* Modern card-style layout instead of table */}
          <div className="space-y-3">
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .fade-in-up {
                animation: fadeInUp 0.5s ease-out;
              }
            `}</style>
            {merged.map(m => {
              const draft = editAll ? (draftMap[m.key] || { name: m.name, color: m.color, enabled: m.enabled }) : null;
              const nameVal = (editAll ? draft.name : m.name) || "";
              const colorVal = (editAll ? draft.color : m.color) || '#5B86E5';
              const enabledVal = editAll ? draft.enabled : m.enabled;
              const isCore = CORE_KEYS.has(m.key);
              const isEditing = editingKey === m.key;

              // Calculate background and border colors using category color
              const bgColor = `${colorVal}08`; // 8% opacity
              const borderColor = `${colorVal}30`; // 30% opacity
              
              return (
                <div 
                  key={m.key} 
                  className="group rounded-xl border-2 shadow-sm hover:shadow-lg transition-all duration-300 p-4 hover:scale-[1.02]"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`,
                    '--tw-shadow-colored': `0 10px 15px -3px ${colorVal}15, 0 4px 6px -4px ${colorVal}10`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 10px 25px -5px ${colorVal}20, 0 10px 10px -5px ${colorVal}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`;
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left section: Badge and Name */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <CategoryBadge color={colorVal} size="lg">
                        {nameVal.toUpperCase()}
                      </CategoryBadge>
                      
                      <div className="flex-1 min-w-0">
                        {editAll ? (
                          <Input
                            value={nameVal.toUpperCase()}
                            onChange={(e) => setDraftMap(d => ({ ...d, [m.key]: { ...(d[m.key] || {}), name: e.target.value.toUpperCase() } }))}
                            className="font-bold text-lg"
                          />
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              value={nameDraft}
                              onChange={(e) => setNameDraft(e.target.value.toUpperCase())}
                              onKeyDown={(e) => { if (e.key === "Enter") saveRowEdit(m); if (e.key === "Escape") cancelRowEdit(); }}
                              className="font-bold text-lg"
                            />
                            <Button size="sm" onClick={() => saveRowEdit(m)} className="inline-flex items-center gap-1">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelRowEdit}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <span
                            className="font-black text-xl tracking-tight cursor-text"
                            style={{ color: colorVal }}
                            title="Doppio clic per rinominare"
                            onDoubleClick={() => enterRowEdit(m)}
                          >
                            {nameVal.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right section: Controls */}
                    <div className="flex items-center gap-3">
                      <ColorPicker
                        value={colorVal}
                        onChange={(c) => changeColor(m, c)}
                        paletteKey={m.key}
                      />
                      
                      {isCore ? (
                        <div className="px-3">
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Core</span>
                        </div>
                      ) : (
                        <Switch
                          checked={!!enabledVal}
                          onCheckedChange={(v) => toggleEnabled(m, v)}
                          style={!enabledVal ? { filter: isDark() ? "" : "grayscale(40%) opacity(.9)" } : {}}
                        />
                      )}
                      
                      <ActionsMenu
                        onEdit={() => enterRowEdit(m)}
                        onRemove={!isCore ? async () => {
                          const ok = await removeMainCat(m.key);
                          if (!ok) {
                            toast.error("Impossibile rimuovere la categoria");
                          }
                        } : undefined}
                        onReset={isCore ? () => resetCore(m) : undefined}
                        disableRemove={isCore}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {merged.length === 0 && (
              <div className="p-8 text-center text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                Nessuna categoria configurata
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}