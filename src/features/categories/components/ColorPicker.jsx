// src/features/categories/components/ColorPicker.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// Palette fisse per main + custom
const PALETTES = {
    // Tutti i colori in formato #RRGGBB (niente alpha) per compatibilità backend
    income: ['#92e4b3', '#56e2c6', '#3D9B68', '#34aa6b', '#7fecc8', '#9be953', '#aaec40', '#06a568'],
    expense: ['#6fb5ee', '#63c4ff', '#1E88E5', '#57b8f0', '#499fca', '#18b4c9', '#537fc2', '#717de6'],
    debt: ['#FF8BA3', '#F06282', '#ED4870', '#A53048', '#F36C6C', '#E53935', '#C62828', '#8E2424'],
    saving: ['#FFFF2A', '#FFEC22', '#F5C51C', '#D4A017', '#FFD54F', '#FFB300', '#FFA726', '#FF8F00'],
    custom: ['#AB47BC', '#8E24AA', '#EC407A', '#D81B60', '#FF7043', '#FF5722', '#00ACC1', '#00838F', '#5C6BC0', '#3949AB', '#C0CA33', '#9E9D24'],
};

export default function ColorPicker({ value, onChange, paletteKey }) {
    const palette = PALETTES[paletteKey] || PALETTES.custom;
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const popRef = useRef(null);

    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!open) return;
        function place() {
            if (!btnRef.current) return;
            const r = btnRef.current.getBoundingClientRect();
            // 6 colonne * 24px + gap → circa 168 + padding
            let left = r.left;
            const width = 200;
            if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
            setPos({ top: r.bottom + 6, left });
        }
        function onDoc(e) {
            const t = e.target;
            const inButton = btnRef.current && btnRef.current.contains(t);
            const inPopover = popRef.current && popRef.current.contains(t);
            if (!inButton && !inPopover) setOpen(false);
        }
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        document.addEventListener('mousedown', onDoc);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
            document.removeEventListener('mousedown', onDoc);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={btnRef}>
            {/* Quadrato colore attuale */}
            <button
                type="button"
                className="h-8 w-10 rounded-md border border-slate-300 dark:border-slate-700"
                title={value}
                style={{ backgroundColor: value || '#ffffff' }}
                onClick={() => setOpen(o => !o)}
            />
            {/* Popover palette in portal (niente clipping) */}
            {open && createPortal(
                <div
                    ref={popRef}
                    className="fixed z-[9999] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl"
                    style={{ top: pos.top, left: pos.left, width: 200 }}
                >
                    <div className="grid grid-cols-6 gap-2">
                        {palette.map((hex) => {
                            const selected = (value || '').toLowerCase() === hex.toLowerCase();
                            return (
                                <button
                                    key={hex}
                                    type="button"
                                    aria-label={`Colore ${hex}`}
                                    title={hex}
                                    onClick={() => { onChange(hex); setOpen(false); }}
                                    className={`h-6 w-6 rounded-sm border ${selected ? 'ring-2 ring-offset-1 ring-sky-500 border-slate-600' : 'border-slate-300 dark:border-slate-700'}`}
                                    style={{ backgroundColor: hex }}
                                />
                            );
                        })}
                    </div>
                </div>,
                document.body
            )
            }
        </div >
    );
}
