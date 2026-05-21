"use client";
import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Check, AlertCircle, FolderOpen, Trash2 } from "lucide-react";
import { CsvDropZone } from "./CsvDropZone";
import { useStore } from "@/lib/store";

export function PoolImport() {
  const session = useStore((s) => s.session);
  const savedSessions = useStore((s) => s.savedSessions);
  const importPoolFromCsv = useStore((s) => s.importPoolFromCsv);
  const addParticipantToPool = useStore((s) => s.addParticipantToPool);
  const removeParticipantFromPool = useStore((s) => s.removeParticipantFromPool);
  const renameParticipant = useStore((s) => s.renameParticipant);
  const setSetupStep = useStore((s) => s.setSetupStep);
  const loadSavedSession = useStore((s) => s.loadSavedSession);
  const deleteSavedSession = useStore((s) => s.deleteSavedSession);

  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string>();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const pool = session?.participantsPool ?? [];
  const otherSessions = savedSessions.filter((saved) => saved.id !== session?.id);
  const manualQuery = newName.trim().toLowerCase();
  const matchingParticipants = manualQuery
    ? pool
        .filter((participant) => participant.name.toLowerCase().includes(manualQuery))
        .slice(0, 6)
    : [];
  const hasExactManualMatch = Boolean(
    manualQuery && pool.some((participant) => participant.name.toLowerCase() === manualQuery)
  );
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
    if (!newName.trim() || hasExactManualMatch) return;
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

      {otherSessions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-300">Tirages sauvegardés</h3>
            <span className="text-xs text-slate-500">{otherSessions.length}</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
            {otherSessions.map((saved) => (
              <div
                key={saved.id}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{saved.name}</p>
                  <p className="text-xs text-slate-500">
                    {saved.cycles.length} cycle(s) · {saved.participantsPool.length} participant(s)
                  </p>
                </div>
                <button
                  onClick={() => loadSavedSession(saved.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Ouvrir ce tirage"
                >
                  <FolderOpen size={15} />
                </button>
                <button
                  onClick={() => deleteSavedSession(saved.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                  title="Supprimer ce tirage"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div className="flex flex-col sm:flex-row gap-2 items-start">
              <div className="relative w-full min-w-0 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Prénom du participant..."
                  maxLength={40}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/60 transition-all"
                />
                {matchingParticipants.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-white/10 bg-slate-950/95 p-1.5 shadow-xl shadow-black/30 backdrop-blur">
                    {matchingParticipants.map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setNewName(participant.name)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <span className="min-w-0 truncate">{participant.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">déjà dans le pool</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddManual}
                disabled={!newName.trim() || hasExactManualMatch}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
            {hasExactManualMatch && (
              <p className="mt-2 text-xs text-amber-400">Ce participant existe déjà dans le pool.</p>
            )}
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
