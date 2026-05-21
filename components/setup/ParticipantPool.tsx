"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shuffle, Trash2 } from "lucide-react";
import { Participant } from "@/lib/types";
import { DraggableParticipantCard } from "./ParticipantCard";
import { AutoAssignDialog } from "./AutoAssignDialog";
import { useStore } from "@/lib/store";

type Props = {
  participants: Participant[];
  total: number;
  cycleId: string;
};

export function ParticipantPool({ participants, total, cycleId }: Props) {
  const clearAllGroups = useStore((s) => s.clearAllGroups);
  const [search, setSearch] = useState("");
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: "pool", data: { isPool: true } });

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-300">
            Pool disponible
            <span className="ml-2 text-xs text-slate-500">({participants.length}/{total} non assignés)</span>
          </h3>
        </div>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-fuchsia-500/50"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAutoAssign(true)}
            disabled={participants.length < 2}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600/30 disabled:opacity-40 text-fuchsia-300 text-xs font-medium border border-fuchsia-500/20 transition-all"
          >
            <Shuffle size={12} />
            Auto-répartir
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs border border-white/10 transition-all"
          >
            <Trash2 size={12} />
            Vider groupes
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-1.5 min-h-[200px] rounded-xl p-2 transition-all duration-200
          ${isOver ? "bg-fuchsia-500/10 border border-fuchsia-500/40" : "border border-transparent"}`}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <DraggableParticipantCard participant={p} />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && participants.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-600 text-sm">
            Tous assignés ! ✓
          </div>
        )}
        {filtered.length === 0 && participants.length > 0 && (
          <div className="flex items-center justify-center h-12 text-slate-600 text-xs">
            Aucun résultat
          </div>
        )}
      </div>

      {showAutoAssign && (
        <AutoAssignDialog
          unassignedCount={participants.length}
          onClose={() => setShowAutoAssign(false)}
        />
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative z-10 bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <p className="text-white mb-4">Vider tous les groupes du cycle 1 ? Les participants reviendront dans le pool.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition-all">Annuler</button>
              <button onClick={() => { clearAllGroups(cycleId); setShowClearConfirm(false); }} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all">Vider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
