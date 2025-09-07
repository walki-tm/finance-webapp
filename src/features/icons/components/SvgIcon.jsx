// src/features/icons/components/SvgIcon.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Carica icone SVG dalle cartelle /public/icons/subcategories/ o /public/icons/main/,
 * con fallback alla cartella root /public/icons/. Normalizza fill/stroke a currentColor,
 * rimuove width/height hardcoded e applica il colore passato.
 * Funziona sia in dev che in build (rispetta import.meta.env.BASE_URL).
 */
export default function SvgIcon({ name, color = "#0b1220", size = 22, className = "", iconType = "auto" }) {
  const [svgHtml, setSvgHtml] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!name) { setSvgHtml(null); return; }

    const fname = name.endsWith(".svg") ? name : `${name}.svg`;
    const base = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, ""); // no slash finale
    
    // Determine paths based on iconType
    let possiblePaths;
    if (iconType === "main") {
      possiblePaths = [
        `${base}/icons/main/${fname}`,
        `${base}/icons/${fname}` // fallback for legacy icons
      ];
    } else if (iconType === "sub") {
      possiblePaths = [
        `${base}/icons/subcategories/${fname}`,
        `${base}/icons/${fname}` // fallback for legacy icons
      ];
    } else {
      // auto: try subcategories → main → root (legacy)
      possiblePaths = [
        `${base}/icons/subcategories/${fname}`,
        `${base}/icons/main/${fname}`,
        `${base}/icons/${fname}` // fallback for legacy icons
      ];
    }

    // Try each path until we find the icon
    const tryLoadIcon = async () => {
      for (const url of possiblePaths) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            return text;
          }
        } catch (error) {
          // Continue to next path
        }
      }
      throw new Error(`Icon ${name} not found in any directory`);
    };

    tryLoadIcon()
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
  }, [name, iconType]);

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
