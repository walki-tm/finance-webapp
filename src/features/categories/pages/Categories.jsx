// src/features/categories/pages/Categories.jsx
import React, { useState } from "react";
import MainCategoriesTab from "./MainCategoriesTab.jsx";
import SubCategoriesTab from "./SubCategoriesTab.jsx";

/* ---------------- Error boundary ---------------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
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

export default function Categories({
  state,
  addSubcat,
  updateSubcat,
  removeSubcat,
  updateMainCat,
  addMainCat,
  removeMainCat,
}) {
  const [tab, setTab] = useState("main");

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("main")}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${tab === "main"
                ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white"
                : "border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60"}`}
          >
            Categorie Main
          </button>
          <button
            onClick={() => setTab("subs")}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${tab === "subs"
                ? "bg-gradient-to-tr from-sky-600 to-indigo-600 text-white"
                : "border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60"}`}
          >
            Sottocategorie
          </button>
        </div>

        {tab === "main" ? (
          <MainCategoriesTab
            state={state}
            updateMainCat={updateMainCat}
            addMainCat={addMainCat}
            removeMainCat={removeMainCat}
          />
        ) : (
          <SubCategoriesTab
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
