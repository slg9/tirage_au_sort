"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { DrawGroup, Participant, Session } from "@/lib/types";
import { WheelDraw } from "./WheelDraw";
import { ShuffleDraw } from "./ShuffleDraw";
import { WinnersReveal } from "./WinnersReveal";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";
import { drawWinners } from "@/lib/draw";
import { useStore } from "@/lib/store";
import { useSounds } from "@/hooks/useSounds";

const SHUFFLE_THRESHOLD = Number.POSITIVE_INFINITY;

type GroupDrawState = {
  phase: "waiting" | "spinning" | "revealing" | "done";
  winners: Participant[];
  currentWinnerIndex: number;
  remainingParticipants: Participant[];
  precomputedWinners: Participant[];
};

export function DrawingScreen() {
  const session = useStore((s) => s.session);

  if (!session) return null;

  return <DrawingSession session={session} />;
}

function DrawingSession({ session }: { session: Session }) {
  const markGroupAsDrawn = useStore((s) => s.markGroupAsDrawn);
  const completeCycle = useStore((s) => s.completeCycle);
  const setView = useStore((s) => s.setView);
  const prepareNextCycle = useStore((s) => s.prepareNextCycle);
  const resetSession = useStore((s) => s.resetSession);
  const newSession = useStore((s) => s.newSession);
  const { playFanfare } = useSounds();

  const cycle = session.cycles[session.currentCycleIndex] ?? session.cycles[0];

  const isLastCycle = session.currentCycleIndex === session.cycles.length - 1;
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [groupStates, setGroupStates] = useState<GroupDrawState[]>(() =>
    cycle.groups.map((g) => ({
      phase: "waiting" as const,
      winners: [],
      currentWinnerIndex: 0,
      remainingParticipants: g.participants,
      precomputedWinners: drawWinners(g.participants, g.winnersCount),
    }))
  );
  const [showFinalReveal, setShowFinalReveal] = useState(false);
  const [allGroupsDone, setAllGroupsDone] = useState(false);

  const activeGroup = cycle.groups[activeGroupIndex];
  const activeState = groupStates[activeGroupIndex];
  const useShuffleMode = activeGroup.participants.length > SHUFFLE_THRESHOLD;

  const handleStartGroup = useCallback(() => {
    setGroupStates((prev) => {
      const updated = [...prev];
      updated[activeGroupIndex] = { ...updated[activeGroupIndex], phase: "spinning" };
      return updated;
    });
    // Mark as drawing in store
    useStore.getState().markGroupAsDrawn(cycle.id, activeGroup.id, []);
  }, [activeGroupIndex, cycle.id, activeGroup.id]);

  const handleSpinDone = useCallback(() => {
    setGroupStates((prev) => {
      const updated = [...prev];
      const state = updated[activeGroupIndex];
      const newWinner = state.precomputedWinners[state.currentWinnerIndex];
      const newWinners = [...state.winners, newWinner];
      const moreWinners = state.currentWinnerIndex + 1 < state.precomputedWinners.length;

      updated[activeGroupIndex] = {
        ...state,
        phase: moreWinners ? "spinning" : "revealing",
        winners: newWinners,
        currentWinnerIndex: state.currentWinnerIndex + 1,
        remainingParticipants: state.remainingParticipants.filter((p) => p.id !== newWinner.id),
      };
      return updated;
    });
  }, [activeGroupIndex]);

  const handleRevealDone = useCallback(() => {
    const state = groupStates[activeGroupIndex];
    // Mark winners in store
    markGroupAsDrawn(cycle.id, activeGroup.id, state.winners);

    setGroupStates((prev) => {
      const updated = [...prev];
      updated[activeGroupIndex] = { ...updated[activeGroupIndex], phase: "done" };
      return updated;
    });

    // Move to next group
    const nextGroupIndex = activeGroupIndex + 1;
    if (nextGroupIndex < cycle.groups.length) {
      setActiveGroupIndex(nextGroupIndex);
      setGroupStates((prev) => {
        const updated = [...prev];
        if (updated[nextGroupIndex].phase === "waiting") {
          updated[nextGroupIndex] = { ...updated[nextGroupIndex], phase: "spinning" };
        }
        return updated;
      });
    } else {
      // All groups done
      completeCycle(cycle.id);
      setAllGroupsDone(true);
      if (isLastCycle) {
        setShowFinalReveal(true);
        playFanfare();
      }
    }
  }, [activeGroupIndex, groupStates, cycle, activeGroup, markGroupAsDrawn, completeCycle, isLastCycle, playFanfare]);

  useEffect(() => {
    if (cycle.groups.length <= 1 || !activeState) return;

    if (activeState.phase === "waiting") {
      const timeout = window.setTimeout(handleStartGroup, 250);
      return () => window.clearTimeout(timeout);
    }

    if (activeState.phase === "revealing") {
      const timeout = window.setTimeout(handleRevealDone, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [activeState, cycle.groups.length, handleRevealDone, handleStartGroup]);

  const allWinners = groupStates.flatMap((s) => s.winners);
  const lastCycleWinners = session.cycles[session.cycles.length - 1]?.groups.flatMap((g) => g.winners) ?? [];

  if (showFinalReveal) {
    return (
      <WinnersReveal
        winners={lastCycleWinners.length > 0 ? lastCycleWinners : allWinners}
        isGrandFinal
        onRestart={resetSession}
        onNewSession={newSession}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setView("overview")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Vue d&apos;ensemble
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">{cycle.name}</h2>
          <p className="text-xs text-slate-400">
            Groupe {activeGroupIndex + 1}/{cycle.groups.length}
          </p>
        </div>
        <div className="w-24" />
      </div>

      {/* Main drawing area */}
      {allGroupsDone && !isLastCycle ? (
        // Between cycles
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Cycle terminé !</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {allWinners.map((w) => (
                <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30">
                  <ParticipantAvatar id={w.id} name={w.name} size={24} color={w.assignedColor} />
                  <span className="text-sm text-white">{w.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <button
            onClick={() => {
              prepareNextCycle();
              setView("overview");
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold text-lg transition-all shadow-xl shadow-fuchsia-500/30"
          >
            <Play size={20} fill="currentColor" />
            Lancer le cycle suivant
          </button>
        </div>
      ) : (
        /* Drawing grid */
        <div>
          {cycle.groups.length === 1 ? (
            /* Single group - large view */
            <SingleGroupDraw
              group={activeGroup}
              state={groupStates[0]}
              onStart={handleStartGroup}
              onSpinDone={handleSpinDone}
              onRevealDone={handleRevealDone}
              useShuffleMode={useShuffleMode}
            />
          ) : (
            /* Multi-group grid */
            <div className={`grid gap-4 ${
              cycle.groups.length <= 4 ? "grid-cols-2" :
              cycle.groups.length <= 6 ? "grid-cols-3" :
              "grid-cols-2 md:grid-cols-4"
            }`}>
              {cycle.groups.map((group, i) => {
                const state = groupStates[i];
                const isActive = i === activeGroupIndex;
                const isShuffleG = group.participants.length > SHUFFLE_THRESHOLD;
                const winnerIdG = state.precomputedWinners[state.currentWinnerIndex]?.id ?? null;

                return (
                  <motion.div
                    key={group.id}
                    animate={{ scale: isActive ? 1 : 0.92, opacity: isActive ? 1 : 0.5 }}
                    className={`rounded-2xl border p-3 transition-all ${isActive ? "border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/20" : "border-white/10"}`}
                  >
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 text-center">{group.name}</h4>
                    <div className="flex justify-center">
                      {isShuffleG ? (
                        <ShuffleDraw
                          participants={state.remainingParticipants}
                          winnerId={winnerIdG ?? ""}
                          isRunning={state.phase === "spinning" && isActive}
                          onDone={isActive ? handleSpinDone : () => {}}
                        />
                      ) : (
                        <WheelDraw
                          participants={state.remainingParticipants.length > 0 ? state.remainingParticipants : group.participants}
                          winnerId={winnerIdG}
                          isSpinning={state.phase === "spinning" && isActive}
                          onDone={isActive ? handleSpinDone : () => {}}
                          size={140}
                        />
                      )}
                    </div>
                    {state.winners.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {state.winners.map((w) => (
                          <div key={w.id} className="flex items-center gap-1 text-xs text-amber-300">
                            <span>👑</span> {w.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SingleGroupDraw({
  group,
  state,
  onStart,
  onSpinDone,
  onRevealDone,
  useShuffleMode,
}: {
  group: DrawGroup;
  state: GroupDrawState;
  onStart: () => void;
  onSpinDone: () => void;
  onRevealDone: () => void;
  useShuffleMode: boolean;
}) {
  const nextWinnerId = state.precomputedWinners[state.currentWinnerIndex]?.id ?? null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-center">
        {useShuffleMode ? (
          <ShuffleDraw
            participants={state.remainingParticipants}
            winnerId={nextWinnerId ?? ""}
            isRunning={state.phase === "spinning"}
            onDone={onSpinDone}
          />
        ) : (
          <WheelDraw
            participants={state.remainingParticipants.length > 1 ? state.remainingParticipants : group.participants}
            winnerId={nextWinnerId}
            isSpinning={state.phase === "spinning"}
            onDone={onSpinDone}
            size={Math.min(380, window?.innerWidth ? window.innerWidth * 0.7 : 380)}
          />
        )}
      </div>

      {/* Winners so far */}
      {state.winners.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {state.winners.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-400/30"
            >
              <ParticipantAvatar id={w.id} name={w.name} size={32} color={w.assignedColor} />
              <span className="text-white font-medium">👑 {w.name}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Controls */}
      {state.phase === "waiting" && (
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg"
        >
          <Play size={18} fill="currentColor" />
          Lancer le tirage
        </button>
      )}

      {state.phase === "revealing" && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-white mb-4">
              Gagnant{state.winners.length > 1 ? "s" : ""} du {group.name}
            </h3>
            <button
              onClick={onRevealDone}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-bold transition-all"
            >
              Continuer →
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
