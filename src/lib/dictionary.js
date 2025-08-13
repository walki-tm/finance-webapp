import { MAIN_CATS } from './constants.js';

export function getEffectiveMains(state) {
  const coreBase = MAIN_CATS.map(m => ({ ...m, core: true }));
  const overridesMap = Object.fromEntries((state.customMainCats || []).map(c => [c.key, c]));

  const effectiveCore = coreBase.map(m => {
    const ov = overridesMap[m.key] || {};
    const enabled = m.key === 'income'
      ? true
      : (ov.enabled ?? state.mainEnabled?.[m.key] ?? true);
    return { ...m, ...ov, enabled, core: true };
  });

  const customOnly = (state.customMainCats || [])
    .filter(c => !coreBase.some(m => m.key === c.key))
    .map(c => ({
      ...c,
      enabled: c.enabled ?? state.mainEnabled?.[c.key] ?? true,
      core: false
    }));

  return [...effectiveCore, ...customOnly];
}
