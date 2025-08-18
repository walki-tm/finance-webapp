// src/features/icons/components/SvgIcon.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Carica /public/icons/<name>.svg, normalizzasa fill/stroke a currentColor,
 * rimuove width/height hardcoded e applica il colore passato.
 * Funziona sia in dev che in build (rispetta import.meta.env.BASE_URL).
 */
export default function SvgIcon({ name, color = "#0b1220", size = 22, className = "" }) {
  const [svgHtml, setSvgHtml] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!name) { setSvgHtml(null); return; }

    const fname = name.endsWith(".svg") ? name : `${name}.svg`;
    const base = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, ""); // no slash finale
    const url = `${base}/icons/${fname}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Impossibile caricare ${url}`);
        return res.text();
      })
      .then((svgText) => {
        let s = svgText
          .replace(/<\?xml[\s\S]*?\?>/g, "")
          .replace(/<!DOCTYPE[\s\S]*?>/g, "");

        // elimina width/height dal <svg ...>
        s = s.replace(/<svg([^>]*?)\swidth="[^"]*"/i, "<svg$1");
        s = s.replace(/<svg([^>]*?)\sheight="[^"]*"/i, "<svg$1");

        // assicura fill="currentColor" al root (se non esiste)
        s = s.replace(/<svg(.*?>)/i, (m, g1) => {
          if (/fill="/i.test(m)) return m;
          return `<svg${g1.replace(">", ' fill="currentColor">')}`;
        });

        // normalizza fill/stroke interni (tranne none) → currentColor
        s = s.replace(/fill="(?!none")[^"]*"/gi, 'fill="currentColor"');
        s = s.replace(/stroke="(?!none")[^"]*"/gi, 'stroke="currentColor"');

        if (mounted.current) setSvgHtml(s.trim());
      })
      .catch(() => mounted.current && setSvgHtml(null));

    return () => { mounted.current = false; };
  }, [name]);

  if (!svgHtml) {
    return (
      <span
        className={`inline-block rounded-full border ${className}`}
        style={{
          width: size, height: size,
          background: "rgba(148,163,184,.15)",
          borderColor: "rgba(148,163,184,.45)"
        }}
      />
    );
  }

  return (
    <span
      className={`inline-flex leading-none ${className}`}
      style={{ width: size, height: size, color, pointerEvents: "none", userSelect: "none" }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
