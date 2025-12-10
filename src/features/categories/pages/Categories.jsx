// src/features/categories/pages/Categories.jsx
import React, { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import MainCategoriesTab from "./MainCategoriesTab.jsx";
import SubCategoriesTab from "./SubCategoriesTab.jsx";
import BatchTransferModal from "../components/BatchTransferModal.jsx";

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
  reorderSubcats,
  updateMainCat,
  addMainCat,
  removeMainCat,
  refreshCategories,
}) {
  const [tab, setTab] = useState("main");
  const [batchTransferOpen, setBatchTransferOpen] = useState(false);
  const [batchTransferSourceId, setBatchTransferSourceId] = useState(null);

  const handleOpenBatchTransfer = (sourceSubcategoryId = null) => {
    setBatchTransferSourceId(sourceSubcategoryId);
    setBatchTransferOpen(true);
  };

  const handleBatchTransferSuccess = (result) => {
    // Mostra toast di successo (se hai un sistema toast)
    console.log('✅ Trasferimento completato:', result);
    
    // Refresh delle categorie per aggiornare i dati
    if (refreshCategories) {
      refreshCategories();
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header con tabs e pulsante batch transfer */}
        <div className="flex items-center justify-between gap-4">
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
          
          {/* Pulsante Batch Transfer */}
          <button
            onClick={() => handleOpenBatchTransfer()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
            title="Trasferisci tutte le transazioni da una sottocategoria ad un'altra"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Trasferisci Transazioni
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
            reorderSubcats={reorderSubcats}
            onOpenBatchTransfer={handleOpenBatchTransfer}
          />
        )}
        
        {/* Batch Transfer Modal */}
        <BatchTransferModal
          open={batchTransferOpen}
          onClose={() => setBatchTransferOpen(false)}
          onSuccess={handleBatchTransferSuccess}
          categories={state.customMainCats || []}
          subcats={state.subcats || {}}
          initialSourceSubcategoryId={batchTransferSourceId}
        />
      </div>
    </ErrorBoundary>
  );
}
