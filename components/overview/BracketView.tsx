"use client";
import { motion } from "framer-motion";
import { CycleCard } from "./CycleCard";
import { AnimatedConnectionLines } from "./AnimatedConnectionLines";
import { SessionControls } from "./SessionControls";
import { useStore } from "@/lib/store";

export function BracketView() {
  const session = useStore((s) => s.session);
  const setView = useStore((s) => s.setView);
  const newSession = useStore((s) => s.newSession);

  if (!session) return null;

  const isSessionDone = session.cycles.every((c) => c.status === "done");
  const lastCycle = session.cycles[session.cycles.length - 1];
  const grandWinners = lastCycle?.groups.flatMap((g) => g.winners) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{session.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {session.cycles.length} cycle(s) · {session.participantsPool.length} participants
          </p>
        </div>
        <button
          onClick={() => setView("setup")}
          className="px-4 py-2 rounded-xl border border-white/20 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all"
        >
          Modifier la config
        </button>
      </div>

      {/* Grand winners banner */}
      {isSessionDone && grandWinners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h2 className="text-xl font-bold text-amber-300">
              Grand{grandWinners.length > 1 ? "s" : ""} gagnant{grandWinners.length > 1 ? "s" : ""}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {grandWinners.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-400/30"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: w.assignedColor || "#f59e0b" }}
                >
                  {w.name[0]?.toUpperCase()}
                </div>
                <span className="text-white font-semibold">{w.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bracket: cycles in horizontal flow */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-2 min-w-max">
          {session.cycles.map((cycle, i) => (
            <div key={cycle.id} className="flex items-center gap-2">
              {i > 0 && (
                <AnimatedConnectionLines
                  count={session.cycles[i - 1].groups.reduce((a, g) => a + g.winnersCount, 0)}
                />
              )}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <CycleCard cycle={cycle} isCurrent={cycle.index === session.currentCycleIndex} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex justify-center">
        <SessionControls />
      </div>
    </div>
  );
}
