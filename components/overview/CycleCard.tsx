"use client";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Play, RotateCcw, Zap } from "lucide-react";
import { Cycle } from "@/lib/types";
import { GroupCard } from "./GroupCard";
import { useStore } from "@/lib/store";

type Props = {
  cycle: Cycle;
  isCurrent: boolean;
};

export function CycleCard({ cycle, isCurrent }: Props) {
  const resetGroupDraw = useStore((s) => s.resetGroupDraw);
  const resetCycleDraw = useStore((s) => s.resetCycleDraw);
  const setView = useStore((s) => s.setView);
  const isDone = cycle.status === "done";
  const isRunning = cycle.status === "running";

  const replayCycle = () => {
    resetCycleDraw(cycle.id);
    setView("drawing");
  };

  const replayGroup = (groupId: string) => {
    resetGroupDraw(cycle.id, groupId);
    setView("drawing");
  };

  return (
    <div className={`rounded-2xl border p-4 min-w-[200px] transition-all duration-300
      ${isDone ? "border-emerald-500/30 bg-emerald-500/5" : isCurrent ? "border-fuchsia-500/40 bg-fuchsia-500/5 shadow-lg shadow-fuchsia-500/10" : "border-white/10 bg-white/3"}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{cycle.name}</h4>
          <p className="text-xs text-slate-500">
            {cycle.groups.length} groupe(s) · {cycle.groups.reduce((a, g) => a + g.winnersCount, 0)} gagnant(s)
          </p>
        </div>
        <div>
          {isDone ? (
            <CheckCircle size={18} className="text-emerald-400" />
          ) : isRunning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Zap size={18} className="text-fuchsia-400" />
            </motion.div>
          ) : (
            <Clock size={18} className="text-slate-600" />
          )}
        </div>
      </div>

      <div className={`grid gap-2 ${cycle.groups.length === 1 ? "grid-cols-1" : cycle.groups.length <= 4 ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-3"}`}>
        {cycle.groups.map((group) => (
          <GroupCard key={group.id} group={group} compact={cycle.groups.length > 4} />
        ))}
      </div>

      {isDone && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <button
            onClick={replayCycle}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
          >
            <RotateCcw size={14} />
            Rejouer tout le cycle
          </button>
          <div className="grid gap-1.5">
            {cycle.groups.map((group) => (
              <button
                key={group.id}
                onClick={() => replayGroup(group.id)}
                className="truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-left text-xs text-slate-200 transition-colors hover:bg-white/10"
              >
                Rejouer {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isRunning && isCurrent && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <button
            onClick={() => setView("drawing")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-fuchsia-500"
          >
            <Play size={14} fill="currentColor" />
            Continuer le tirage
          </button>
        </div>
      )}
    </div>
  );
}
