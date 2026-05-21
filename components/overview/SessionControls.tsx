"use client";
import { motion } from "framer-motion";
import { Play, Trophy, RefreshCw, RotateCcw, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";

export function SessionControls() {
  const session = useStore((s) => s.session);
  const setView = useStore((s) => s.setView);
  const prepareNextCycle = useStore((s) => s.prepareNextCycle);
  const resetSession = useStore((s) => s.resetSession);
  const newSession = useStore((s) => s.newSession);

  if (!session) return null;

  const currentCycle = session.cycles[session.currentCycleIndex];
  const isLastCycle = session.currentCycleIndex === session.cycles.length - 1;
  const isSessionDone = session.cycles.every((c) => c.status === "done");
  const prevCycleDone = session.currentCycleIndex === 0
    ? false
    : session.cycles[session.currentCycleIndex - 1]?.status === "done";
  const currentCycleDone = currentCycle?.status === "done";

  if (isSessionDone) {
    return (
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-xl font-bold text-white mb-1">Session terminée !</h3>
          <p className="text-slate-400 text-sm">
            {session.cycles[session.cycles.length - 1].groups.flatMap((g) => g.winners).length} grand(s) gagnant(s)
          </p>
        </motion.div>
        <div className="flex gap-3">
          <button
            onClick={resetSession}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-all text-sm"
          >
            <RotateCcw size={16} />
            Recommencer
          </button>
          <button
            onClick={newSession}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-medium transition-all text-sm shadow-lg shadow-fuchsia-500/20"
          >
            <RefreshCw size={16} />
            Nouvelle session
          </button>
        </div>
      </div>
    );
  }

  // Between cycles: current done, next not launched
  if (currentCycleDone && !isLastCycle) {
    const nextCycle = session.cycles[session.currentCycleIndex + 1];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-slate-400 text-sm">
          Cycle {session.currentCycleIndex + 1} terminé — prêt pour le suivant
        </p>
        <button
          onClick={() => {
            prepareNextCycle();
            setView("drawing");
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold text-lg transition-all shadow-xl shadow-fuchsia-500/30"
        >
          <ArrowRight size={22} />
          Lancer le {nextCycle.name}
        </button>
      </motion.div>
    );
  }

  // Launch current cycle
  if (currentCycle?.status === "pending") {
    const isLast = isLastCycle;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <button
          onClick={() => setView("drawing")}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl
            ${isLast
              ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 shadow-amber-500/30"
              : "bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white shadow-fuchsia-500/30"
            }`}
        >
          {isLast ? <Trophy size={22} /> : <Play size={22} fill="currentColor" />}
          {isLast ? "Lancer le tirage final" : `Lancer le ${currentCycle.name}`}
        </button>
      </motion.div>
    );
  }

  return null;
}
