import { useEffect, useMemo, useState } from 'react';
import { MAIN_CATS } from '../../lib/constants.js';
import { api } from '../../lib/api.js';

const CORE_UP = new Set(['INCOME', 'EXPENSE', 'DEBT', 'SAVING', 'SAVINGS']);
const normalizeMainKey = (main) => {
  const u = String(main || 'EXPENSE').toUpperCase();
  const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' };
  return map[u] || u.toLowerCase();
};
const toUp = (s) => String(s || '').toUpperCase();

export function useCategories(token) {
  const [customMainCats, setCustomMainCats] = useState([]);
  const [subcats, setSubcats] = useState({});
  const [mainEnabled, setMainEnabled] = useState({ income: true, expense: true, debt: true, saving: true });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const cats = await api.listCategories(token);
        const byCore = {};
        const customs = [];
        const subByMain = {};
        const enabledMap = {};

        for (const c of cats) {
          const up = toUp(c.main);
          if (CORE_UP.has(up)) byCore[up] = c; else customs.push(c);
        }

        const list = [];

        for (const up of CORE_UP) {
          const c = byCore[up];
          if (!c) continue;
          const key = normalizeMainKey(up);
          list.push({
            key,
            id: c.id,
            name: c.name,
            color: c.colorHex || MAIN_CATS.find(m => m.key === key)?.color,
            iconKey: c.iconKey || undefined,
          });
          if (typeof c.visible === 'boolean') enabledMap[key] = c.visible;
          subByMain[key] = (c.subcats || []).map(sc => ({ id: sc.id, name: sc.name, iconKey: sc.iconKey || null, sortOrder: sc.sortOrder ?? 0 }));
        }

        for (const c of customs) {
          const key = String(c.main || '').toLowerCase();
          list.push({
            key,
            id: c.id,
            name: c.name,
            color: c.colorHex || '#5B86E5',
            iconKey: c.iconKey || undefined,
          });
          if (typeof c.visible === 'boolean') enabledMap[key] = c.visible;
          const arr = (c.subcats || []).map(sc => ({ id: sc.id, name: sc.name, iconKey: sc.iconKey || null, sortOrder: sc.sortOrder ?? 0 }));
          subByMain[key] = (subByMain[key] || []).concat(arr);
        }

        setCustomMainCats(list);
        setSubcats(subByMain);
        setMainEnabled(s => ({ income: true, expense: true, debt: true, saving: true, ...enabledMap }));
      } catch (err) {
        console.error('Errore caricamento categorie:', err);
      }
    })();
  }, [token]);

  const addMainCat = async (obj) => {
    try {
      const created = await api.addCategory(token, {
        main: String(obj.key).toUpperCase(),
        name: obj.name,
        colorHex: obj.color,
        iconKey: obj.iconKey || null,
      });
      setCustomMainCats(s => [...s, { ...obj, id: created.id }]);
      return created;
    } catch (err) {
      console.error('Errore addMainCat:', err);
      throw err;
    }
  };

  const updateMainCat = async (key, patch) => {
    const cat = customMainCats.find(c => c.key === key);
    if (!cat) return;
    try {
      const payload = {
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.color ? { colorHex: patch.color } : {}),
        ...(patch.iconKey ? { iconKey: patch.iconKey } : {}),
        ...(typeof patch.visible === 'boolean' ? { visible: patch.visible } : {}),
      };
      const updated = await api.updateCategory(token, cat.id, payload);
      setCustomMainCats(s => s.map(c => (c.key === key ? { ...c, ...updated, color: updated.colorHex ?? c.color } : c)));
      if (typeof updated.visible === 'boolean') {
        setMainEnabled(s => ({ ...s, [key]: updated.visible }));
      }
      return updated;
    } catch (err) {
      console.error('Errore updateMainCat:', err);
      throw err;
    }
  };

  const removeMainCat = async (key) => {
    const cat = customMainCats.find(c => c.key === key);
    if (!cat) return false;
    try {
      await api.deleteCategory(token, cat.id);
      setCustomMainCats(s => s.filter(c => c.key !== key));
      setSubcats(s => {
        const next = { ...s };
        delete next[key];
        return next;
      });
      setMainEnabled(s => {
        const { [key]: _drop, ...rest } = s;
        return rest;
      });
      return true;
    } catch (err) {
      console.error('Errore removeMainCat:', err);
      return false;
    }
  };

  const addSubcat = async (main, obj) => {
    const cat = customMainCats.find(c => c.key === main);
    if (!cat) return;
    try {
      const created = await api.addSubCategory(token, {
        categoryId: cat.id,
        name: obj.name,
        iconKey: obj.iconKey || null,
      });
      setSubcats(s => ({ ...s, [main]: [...(s[main] || []), created] }));
      return created;
    } catch (err) {
      console.error('Errore addSubcat:', err);
      throw err;
    }
  };

  const updateSubcat = async (main, id, patch) => {
    try {
      const updated = await api.updateSubCategory(token, id, patch);
      setSubcats(s => ({
        ...s,
        [main]: (s[main] || []).map(sc => (sc.id === id ? { ...sc, ...updated } : sc)),
      }));
      return updated;
    } catch (err) {
      console.error('Errore updateSubcat:', err);
      throw err;
    }
  };

  const removeSubcat = async (main, id) => {
    try {
      await api.deleteSubCategory(token, id);
      setSubcats(s => ({ ...s, [main]: (s[main] || []).filter(sc => sc.id !== id) }));
      return true;
    } catch (err) {
      console.error('Errore removeSubcat:', err);
      return false;
    }
  };

  const mainsForModal = useMemo(() => {
    const base = MAIN_CATS.map(m => ({ ...m, enabled: mainEnabled[m.key] !== false }));
    const custom = customMainCats.map(c => ({ ...c, enabled: mainEnabled[c.key] !== false }));
    const byKey = Object.fromEntries(base.map(m => [m.key, m]));
    for (const c of custom) byKey[c.key] = { ...(byKey[c.key] || {}), ...c };
    return Object.values(byKey);
  }, [customMainCats, mainEnabled]);

  function getCategoryIdByMain(key) {
    const list = customMainCats;
    const found = list.find(c => c.key === key);
    return found?.id || null;
  }

  const reorderSubcats = async (main, idsInOrder) => {
    const items = idsInOrder.map((id, idx) => ({ id, sortOrder: idx }));

    // optimistic update
    let prev;
    setSubcats((s) => {
      prev = s;
      const nextList = (s[main] || [])
        .slice()
        .sort((a, b) => idsInOrder.indexOf(a.id) - idsInOrder.indexOf(b.id))
        .map((sc, idx) => ({ ...sc, sortOrder: idx }));
      return { ...s, [main]: nextList };
    });

    try {
      await api.reorderSubCategories(token, items);
      return true;
    } catch (e) {
      // rollback on failure
      if (prev) setSubcats(prev);
      throw e;
    }
  };

  return {
    customMainCats,
    subcats,
    mainEnabled,
    mainsForModal,
    addMainCat,
    updateMainCat,
    removeMainCat,
    addSubcat,
    updateSubcat,
    removeSubcat,
    reorderSubcats,
  };
}

export default useCategories;