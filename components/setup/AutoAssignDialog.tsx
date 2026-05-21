"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, X } from "lucide-react";
import { useStore } from "@/lib/store";

type Props = {
  unassignedCount: number;
  onClose: () => void;
};

export function AutoAssignDialog({ unassignedCount, onClose }: Props) {
  const autoAssignPoolToGroups = useStore((s) => s.autoAssignPoolToGroups);
  const [groupCount, setGroupCount] = useState(
    Math.max(2, Math.ceil(unassignedCount / 4))
  );

  const perGroup = Math.ceil(unassignedCount / groupCount);

  const handleAssign = () => {
    autoAssignPoolToGroups(groupCount);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10 bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shuffle size={18} className="text-fuchsia-400" />
              Répartition automatique
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            Répartir les <span className="text-white font-medium">{unassignedCount}</span> participants
            non assignés en N groupes équilibrés.
          </p>

          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2">
              Nombre de groupes
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGroupCount((n) => Math.max(2, n - 1))}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
              >
                −
              </button>
              <span className="text-2xl font-bold text-white w-8 text-center">{groupCount}</span>
              <button
                onClick={() => setGroupCount((n) => Math.min(Math.floor(unassignedCount / 2), n + 1))}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
              >
                +
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              ≈ {perGroup} participants par groupe
            </p>
          </div>

          <button
            onClick={handleAssign}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold transition-all"
          >
            Répartir équitablement
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
