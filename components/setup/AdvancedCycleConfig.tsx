"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Settings, Plus, Minus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Cycle } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";

type Props = {
  cycle: Cycle;
  prevCycleWinners: { id: string; name: string; assignedColor?: string }[];
};

export function AdvancedCycleConfig({ cycle, prevCycleWinners }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const setWinnersCount = useStore((s) => s.setWinnersCount);
  const toggleSplitMode = useStore((s) => s.toggleSplitMode);
  const addSubgroup = useStore((s) => s.addSubgroup);
  const removeSubgroup = useStore((s) => s.removeSubgroup);
  const assignWinnerToSubgroup = useStore((s) => s.assignWinnerToSubgroup);
  const unassignWinnerFromSubgroup = useStore((s) => s.unassignWinnerFromSubgroup);

  const mainGroup = cycle.groups[0];
  const allAssigned = cycle.splitMode === "subgroups"
    ? prevCycleWinners.every((w) => cycle.groups.some((g) => g.participants.some((p) => p.id === w.id)))
    : true;

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h4 className="text-sm font-medium text-white">{cycle.name}</h4>
          <p className="text-xs text-slate-500">
            {prevCycleWinners.length} gagnant(s) du cycle précédent
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cycle.splitMode === "merged" && mainGroup && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Gagnants :</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, prevCycleWinners.length - 1)}
                value={mainGroup.winnersCount}
                onChange={(e) => setWinnersCount(cycle.id, mainGroup.id, Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center bg-white/10 border border-white/20 rounded text-white text-sm py-1 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs border border-white/10 transition-all"
          >
            <Settings size={12} />
            Options avancées
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
              {/* Split mode toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Diviser en sous-groupes</p>
                  <p className="text-xs text-slate-500">Répartir manuellement les gagnants entre plusieurs groupes</p>
                </div>
                <button
                  onClick={() => toggleSplitMode(cycle.id)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${cycle.splitMode === "subgroups" ? "bg-fuchsia-600" : "bg-white/20"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${cycle.splitMode === "subgroups" ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {cycle.splitMode === "subgroups" && (
                <div className="space-y-3">
                  {!allAssigned && (
                    <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                      Assignez tous les gagnants du cycle précédent aux sous-groupes
                    </p>
                  )}

                  {/* Winner assignment */}
                  <div>
                    <h5 className="text-xs font-medium text-slate-400 mb-2">Gagnants à répartir :</h5>
                    <div className="flex flex-wrap gap-2">
                      {prevCycleWinners.map((w) => {
                        const assignedGroup = cycle.groups.find((g) => g.participants.some((p) => p.id === w.id));
                        return (
                          <div key={w.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all
                            ${assignedGroup ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}>
                            <ParticipantAvatar id={w.id} name={w.name} size={20} color={w.assignedColor} />
                            {w.name}
                            {assignedGroup && <span className="text-emerald-500">→ {assignedGroup.name}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subgroups */}
                  {cycle.groups.map((group) => (
                    <div key={group.id} className="rounded-lg border border-white/10 bg-white/3 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{group.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Gagnants:</span>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, group.participants.length - 1)}
                            value={group.winnersCount}
                            onChange={(e) => setWinnersCount(cycle.id, group.id, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 text-center bg-white/10 border border-white/20 rounded text-white text-xs py-0.5 focus:outline-none"
                          />
                          {cycle.groups.length > 2 && (
                            <button onClick={() => removeSubgroup(cycle.id, group.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {prevCycleWinners.map((w) => {
                          const isHere = group.participants.some((p) => p.id === w.id);
                          const isElsewhere = !isHere && cycle.groups.some((g) => g.id !== group.id && g.participants.some((p) => p.id === w.id));
                          return (
                            <button
                              key={w.id}
                              onClick={() => isHere ? unassignWinnerFromSubgroup(cycle.id, group.id, w.id) : assignWinnerToSubgroup(cycle.id, group.id, w.id)}
                              disabled={isElsewhere}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-all
                                ${isHere ? "border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-300" : isElsewhere ? "border-white/5 bg-white/3 text-slate-600 cursor-not-allowed" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/30"}`}
                            >
                              {w.name}
                              {isHere && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSubgroup(cycle.id)}
                    className="w-full py-2 rounded-lg border border-dashed border-white/20 text-slate-500 hover:text-slate-300 hover:border-white/40 text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus size={12} />
                    Ajouter un sous-groupe
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
