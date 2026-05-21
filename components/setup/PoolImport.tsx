"use client";
import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Check, AlertCircle } from "lucide-react";
import { CsvDropZone } from "./CsvDropZone";
import { useStore } from "@/lib/store";

export function PoolImport() {
  const session = useStore((s) => s.session);
  const importPoolFromCsv = useStore((s) => s.importPoolFromCsv);
  const addParticipantToPool = useStore((s) => s.addParticipantToPool);
  const removeParticipantFromPool = useStore((s) => s.removeParticipantFromPool);
  const renameParticipant = useStore((s) => s.renameParticipant);
  const setSetupStep = useStore((s) => s.setSetupStep);

  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string>();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const pool = session?.participantsPool ?? [];
  const nameSet = new Map<string, number>();
  pool.forEach((p) => nameSet.set(p.name.toLowerCase(), (nameSet.get(p.name.toLowerCase()) ?? 0) + 1));

  const handleCsvParsed = (content: string) => {
    const { success, error } = importPoolFromCsv(content);
    if (!success) {
      setCsvError(error);
      setCsvPreview([]);
    } else {
      setCsvError(undefined);
      const lines = content.split(/\r?\n/).filter((l) => l.trim()).slice(0, 500);
      setCsvPreview(lines);
    }
  };

  const handleAddManual = () => {
    if (!newName.trim()) return;
    addParticipantToPool(newName.trim());
    setNewName("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddManual();
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameParticipant(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-4">
      {/* Session name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la session</label>
        <input
          type="text"
          value={session?.name ?? ""}
          onChange={(e) => useStore.getState().updateSessionName(e.target.value)}
          placeholder="ex: Tombola Noël 2026"
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/60 focus:bg-white/8 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 lg:items-start">
        <div className="space-y-4">
          {/* CSV Import */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Importer depuis un fichier CSV</h3>
            <CsvDropZone onParsed={handleCsvParsed} preview={csvPreview} error={csvError} />
          </div>

          {/* Manual add */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Ajouter manuellement</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Prénom du participant..."
                maxLength={40}
                className="min-w-0 flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/60 transition-all"
              />
              <button
                onClick={handleAddManual}
                disabled={!newName.trim()}
                className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Pool list */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-300">
              Pool de participants ({pool.length})
            </h3>
          </div>
          {pool.length > 0 ? (
            <div className="max-h-[46vh] lg:max-h-[56vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
                <AnimatePresence mode="popLayout">
                  {pool.map((p) => {
                    const isDuplicate = (nameSet.get(p.name.toLowerCase()) ?? 0) > 1;
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 group"
                      >
                        {editingId === p.id ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRename(p.id); if (e.key === "Escape") setEditingId(null); }}
                            className="min-w-0 flex-1 bg-transparent text-white text-sm outline-none border-b border-fuchsia-500"
                          />
                        ) : (
                          <span className="min-w-0 flex-1 text-sm text-white truncate">{p.name}</span>
                        )}
                        {isDuplicate && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">doublon</span>
                        )}
                        {editingId === p.id ? (
                          <button onClick={() => handleRename(p.id)} className="shrink-0 text-emerald-400 hover:text-emerald-300">
                            <Check size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setEditingId(p.id); setEditingName(p.name); }}
                            className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => removeParticipantFromPool(p.id)}
                          className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/3 text-sm text-slate-500">
              Aucun participant pour le moment
            </div>
          )}
        </div>
      </div>

      {/* Next step button */}
      <button
        onClick={() => setSetupStep("groups")}
        disabled={pool.length < 2}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg shadow-fuchsia-500/20"
      >
        Suivant : composer les groupes →
      </button>
      {pool.length < 2 && (
        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <AlertCircle size={12} /> Ajoutez au moins 2 participants pour continuer
        </p>
      )}
    </div>
  );
}
