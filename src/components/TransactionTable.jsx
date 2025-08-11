import React, { useState } from 'react';
import { Button } from './ui.jsx';
import { Pencil, Trash2, FileText, X } from 'lucide-react';
import { MAIN_CATS } from '../lib/constants.js';
import { nice } from '../lib/utils.js';
import { IconView } from './IconPicker.jsx';

/* Da HEX a rgba con alpha */
function hexToRgba(hex, a = 1) {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* Colori MAIN (da MAIN_CATS) */
const MAIN_COLOR = MAIN_CATS.reduce((acc, m) => {
  acc[m.key] = m.color;
  return acc;
}, {});

/* Stile del badge Tipo (usa i colori reali della main) */
function typeBadgeStyle(mainKey) {
  const base = MAIN_COLOR[mainKey] || '#94a3b8';
  return {
    backgroundColor: hexToRgba(base, 0.18),
    color: base,
    fontWeight: 700,
    borderRadius: 8,
    padding: '2px 8px',
  };
}

/* Colori richiesti per Importi (light mode) */
const NEG_TEXT_LIGHT = '#c62828';
const POS_TEXT_LIGHT = '#2e7d32';

export default function TransactionTable({ rows, state, onEdit, onDelete }) {
  // Modale Nota
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteMeta, setNoteMeta] = useState(null);

  const openNote = (t) => {
    setNoteText(t.note || '');
    setNoteMeta({
      date: new Date(t.date).toLocaleDateString('it-IT'),
      main: MAIN_CATS.find(m => m.key === t.main)?.name || t.main,
      sub: t.sub,
    });
    setNoteOpen(true);
  };
  const closeNote = () => { setNoteOpen(false); setNoteText(''); setNoteMeta(null); };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e6e6e6] dark:border-slate-700/40">
      <table className="w-full text-sm">
        {/* HEADER (più chiaro in light, solido in dark) */}
        <thead className="sticky top-0 bg-[#f7f9fc] dark:bg-slate-800">
          <tr>
            <th className="text-left p-2 whitespace-nowrap">Data</th>
            <th className="text-left p-2 whitespace-nowrap">Tipo</th>
            <th className="text-left p-2 whitespace-nowrap">Categoria</th>
            <th className="text-right p-2 whitespace-nowrap">Importo</th>
            <th className="text-left p-2 whitespace-nowrap">Note</th>
            <th className="p-2"></th>
          </tr>
        </thead>

        <tbody>
          {rows.map((t, i) => {
            const mc = MAIN_CATS.find(m => m.key === t.main);
            const sc = (state.subcats[t.main] || []).find(s => s.name === t.sub);
            const hasNote = Boolean(t.note && t.note.trim());

            const badge = typeBadgeStyle(t.main);

            // Importi: pill con testo più saturo (light) e classi dark coerenti
            const amt = Number(t.amount) || 0;
            let amtClasses =
              'px-2 py-0.5 rounded inline-block text-right min-w-[80px]'; // allineamento coerente
            let amtStyle = {};

            if (amt > 0) {
              amtClasses +=
                ' bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300';
              amtStyle.color = POS_TEXT_LIGHT; // light mode
            } else if (amt < 0) {
              amtClasses +=
                ' bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300';
              amtStyle.color = NEG_TEXT_LIGHT; // light mode
            } else {
              amtClasses += ' text-slate-700 dark:text-slate-300';
            }

            return (
              <tr
                key={t.id}
                className="
                  align-top
                  border-t border-[#e6e6e6] dark:border-slate-700/40
                  odd:bg-[#f8f9fa] dark:odd:bg-slate-800/40
                "
              >
                <td className="p-2 whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('it-IT')}
                </td>

                <td className="p-2 whitespace-nowrap">
                  <span className="inline-flex items-center" style={badge}>
                    {mc?.name}
                  </span>
                </td>

                <td className="p-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <IconView
                      name={sc?.iconKey}
                      color={MAIN_COLOR[t.main]}
                      customIcons={state.customIcons}
                    />
                    <span>{t.sub}</span>
                  </div>
                </td>

                <td className="p-2 text-right whitespace-nowrap">
                  <span className={amtClasses} style={amtStyle}>
                    {nice(t.amount)}
                  </span>
                </td>

                <td className="p-2 whitespace-nowrap">
                  {/* Wrapper per tooltip on-hover */}
                  <span className="relative group inline-flex">
                    <button
                      type="button"
                      onClick={() => hasNote && openNote(t)}
                      disabled={!hasNote}
                      title={hasNote ? 'Nota' : 'Nessuna nota'}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition
                        ${hasNote
                          ? 'text-emerald-600 border-emerald-400/40 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-900/20'
                          : 'text-slate-400 border-slate-300/60 dark:border-slate-600/50 opacity-50 cursor-default'
                        }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Nota</span>
                    </button>

                    {/* Tooltip preview (solo se c'è nota) */}
                    {hasNote && (
                      <div
                        className="
                          absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64
                          rounded-lg border border-slate-200 dark:border-slate-700
                          bg-white dark:bg-slate-900
                          text-xs text-slate-700 dark:text-slate-200
                          px-3 py-2 shadow-lg
                          opacity-0 group-hover:opacity-100 pointer-events-none
                          transition
                        "
                      >
                        <div className="font-medium mb-1">Anteprima nota</div>
                        <div className="whitespace-pre-wrap break-words">
                          {t.note}
                        </div>
                      </div>
                    )}
                  </span>
                </td>

                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => onEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => onDelete(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td className="p-4 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                Nessuna transazione
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODALE NOTA */}
      {noteOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeNote} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#e6e6e6] dark:border-slate-700/40 bg-white dark:bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e6e6] dark:border-slate-700/40">
                <div className="text-slate-700 dark:text-slate-200">
                  <div className="font-semibold text-slate-900 dark:text-white">Nota</div>
                  {noteMeta && (
                    <div className="mt-0.5 text-slate-600 dark:text-slate-300/80">
                      <span className="mr-2">{noteMeta.date}</span>
                      <span className="opacity-80">· {noteMeta.main} / {noteMeta.sub}</span>
                    </div>
                  )}
                </div>
                <button
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={closeNote}
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </button>
              </div>

              <div className="p-5">
                <textarea
                  readOnly
                  value={noteText}
                  className="
                    w-full h-40 rounded-xl border px-3 py-2 text-sm
                    border-[#e6e6e6] dark:border-slate-700/50
                    bg-white dark:bg-slate-800
                    text-slate-900 dark:text-slate-100
                  "
                />
              </div>

              <div className="px-5 pb-5 flex justify-end">
                <button
                  onClick={closeNote}
                  className="
                    px-3 py-2 rounded-xl text-sm border
                    border-[#e6e6e6] dark:border-slate-700/50
                    text-slate-800 dark:text-slate-100
                    hover:bg-slate-100 dark:hover:bg-slate-800
                  "
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
