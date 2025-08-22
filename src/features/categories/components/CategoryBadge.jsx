import React from "react";

export const isDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

function hexToRgba(hex, a = 1) {
  const h = (hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function CategoryBadge({ color, children, size = "md" }) {
  const dark = isDark();
  const pad =
    size === "sm" ? "px-2 py-1.5 text-xs"
      : size === "lg" ? "px-4 py-2.5 text-base font-black"
        : "px-3 py-2 text-sm font-bold";
  
  const shadowClass = size === "lg" ? "shadow-md" : "shadow-sm";
  
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wide rounded-xl ${pad} ${shadowClass} transition-all duration-200`}
      style={{
        backgroundColor: hexToRgba(color, dark ? 0.15 : 0.12),
        color: color,
        border: `2px solid ${hexToRgba(color, dark ? 0.4 : 0.3)}`
      }}
    >
      {children}
    </span>
  );
}
