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
                  const draft = editAll ? (draftMap[m.key] || { name: m.name, color: m.color, enabled: m.enabled }) : null;
                  const nameVal = (editAll ? draft.name : m.name) || "";
                  const colorVal = (editAll ? draft.color : m.color) || '#5B86E5';
                  const enabledVal = editAll ? draft.enabled : m.enabled;
                  const isCore = CORE_KEYS.has(m.key);
                  const isEditing = editingKey === m.key;

                  return (
                    <tr key={m.key} className="border-t border-slate-200/10 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-2 py-3 whitespace-nowrap">
                        <CategoryBadge color={colorVal} size="lg">
                          {nameVal.toUpperCase()}
                        </CategoryBadge>
                      </td>

                      <td className="px-2 py-3">
                        {editAll ? (
                          <Input
                            value={nameVal.toUpperCase()}
                            onChange={(e) => setDraftMap(d => ({ ...d, [m.key]: { ...(d[m.key] || {}), name: e.target.value.toUpperCase() } }))}
                            className="font-semibold"
                          />
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              value={nameDraft}
                              onChange={(e) => setNameDraft(e.target.value.toUpperCase())}
                              onKeyDown={(e) => { if (e.key === "Enter") saveRowEdit(m); if (e.key === "Escape") cancelRowEdit(); }}
                              className="font-semibold"
                            />
                            <Button size="sm" onClick={() => saveRowEdit(m)} className="inline-flex items-center gap-1">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelRowEdit}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <span
                            className="font-semibold cursor-text"
                            title="Doppio clic per rinominare"
                            onDoubleClick={() => enterRowEdit(m)}
                          >
                            {nameVal.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-3">
                        <ColorPicker
                          value={colorVal}
                          onChange={(c) => changeColor(m, c)}
                          paletteKey={m.key}
                        />
                      </td>

                      <td className="px-2 py-3">
                        {isCore ? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <Switch
                            checked={!!enabledVal}
                            onCheckedChange={(v) => toggleEnabled(m, v)}
                            style={!enabledVal ? { filter: isDark() ? "" : "grayscale(40%) opacity(.9)" } : {}}
                          />
                        )}
                      </td>

                      <td className="px-2 py-3">
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