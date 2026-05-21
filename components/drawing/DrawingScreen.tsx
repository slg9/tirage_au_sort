"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
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

function createGroupDrawState(group: DrawGroup): GroupDrawState {
  if (group.status === "done" && group.winners.length > 0) {
    const winnerIds = new Set(group.winners.map((winner) => winner.id));
    return {
      phase: "done",
      winners: group.winners,
      currentWinnerIndex: group.winners.length,
      remainingParticipants: group.participants.filter((participant) => !winnerIds.has(participant.id)),
      precomputedWinners: group.winners,
    };
  }

  return {
    phase: "waiting",
    winners: [],
    currentWinnerIndex: 0,
    remainingParticipants: group.participants,
    precomputedWinners: drawWinners(group.participants, group.winnersCount),
  };
}

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
  const resetGroupDraw = useStore((s) => s.resetGroupDraw);
  const resetSession = useStore((s) => s.resetSession);
  const setSetupStep = useStore((s) => s.setSetupStep);
  const newSession = useStore((s) => s.newSession);
  const { playFanfare } = useSounds();

  const cycle = session.cycles[session.currentCycleIndex] ?? session.cycles[0];

  const isLastCycle = session.currentCycleIndex === session.cycles.length - 1;
  const initialGroupIndex = Math.max(0, cycle.groups.findIndex((group) => group.status !== "done"));
  const [activeGroupIndex, setActiveGroupIndex] = useState(initialGroupIndex);
  const [groupStates, setGroupStates] = useState<GroupDrawState[]>(() =>
    cycle.groups.map(createGroupDrawState)
  );
  const [showFinalReveal, setShowFinalReveal] = useState(false);
  const [allGroupsDone, setAllGroupsDone] = useState(false);
  const [singleWheelSize, setSingleWheelSize] = useState(410);
  const [replayGroupIndex, setReplayGroupIndex] = useState<number | null>(null);

  const safeActiveGroupIndex = Math.min(activeGroupIndex, Math.max(0, cycle.groups.length - 1));
  const activeGroup = cycle.groups[safeActiveGroupIndex];
  const activeState = groupStates[safeActiveGroupIndex];
  const useShuffleMode = (activeGroup?.participants.length ?? 0) > SHUFFLE_THRESHOLD;

  const handleStartGroup = useCallback(() => {
    if (!activeGroup) return;
    setGroupStates((prev) => {
      const updated = [...prev];
      updated[safeActiveGroupIndex] = { ...updated[safeActiveGroupIndex], phase: "spinning" };
      return updated;
    });
    // Mark as drawing in store
    useStore.getState().markGroupAsDrawn(cycle.id, activeGroup.id, []);
  }, [activeGroup, safeActiveGroupIndex, cycle.id]);

  const handleSpinDone = useCallback(() => {
    setGroupStates((prev) => {
      const updated = [...prev];
      const state = updated[safeActiveGroupIndex];
      if (!state) return prev;
      const newWinner = state.precomputedWinners[state.currentWinnerIndex];
      if (!newWinner) return prev;
      const newWinners = [...state.winners, newWinner];
      const moreWinners = state.currentWinnerIndex + 1 < state.precomputedWinners.length;

      updated[safeActiveGroupIndex] = {
        ...state,
        phase: moreWinners ? "spinning" : "revealing",
        winners: newWinners,
        currentWinnerIndex: state.currentWinnerIndex + 1,
        remainingParticipants: state.remainingParticipants.filter((p) => p.id !== newWinner.id),
      };
      return updated;
    });
  }, [safeActiveGroupIndex]);

  const handleRevealDone = useCallback(() => {
    if (!activeGroup) return;
    const state = groupStates[safeActiveGroupIndex];
    if (!state) return;
    // Mark winners in store
    markGroupAsDrawn(cycle.id, activeGroup.id, state.winners);

    setGroupStates((prev) => {
      const updated = [...prev];
      updated[safeActiveGroupIndex] = { ...updated[safeActiveGroupIndex], phase: "done" };
      return updated;
    });

    const completedStates = groupStates.map((groupState, index) =>
      index === safeActiveGroupIndex ? { ...groupState, phase: "done" as const } : groupState
    );

    if (replayGroupIndex !== null) {
      completeCycle(cycle.id);
      setReplayGroupIndex(null);
      setAllGroupsDone(true);
      return;
    }

    // Move to next group that still needs a draw.
    const nextGroupIndex = completedStates.findIndex((groupState, index) =>
      index > safeActiveGroupIndex && groupState.phase !== "done"
    );
    if (nextGroupIndex !== -1) {
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
        playFanfare();
      }
    }
  }, [activeGroup, safeActiveGroupIndex, groupStates, replayGroupIndex, cycle, markGroupAsDrawn, completeCycle, isLastCycle, playFanfare]);

  const handleReplayGroup = useCallback((groupIndex: number) => {
    const group = cycle.groups[groupIndex];
    if (!group) return;
    resetGroupDraw(cycle.id, group.id);
    setShowFinalReveal(false);
    setAllGroupsDone(false);
    setReplayGroupIndex(groupIndex);
    setActiveGroupIndex(groupIndex);
    setGroupStates((prev) => {
      const updated = [...prev];
      updated[groupIndex] = { ...createGroupDrawState(group), phase: "spinning" };
      return updated;
    });
  }, [cycle, resetGroupDraw]);

  const handleReplayFullDraw = useCallback(() => {
    resetSession();
    setView("drawing");
  }, [resetSession, setView]);

  const handleEditGroups = useCallback(() => {
    resetSession();
    setSetupStep("groups");
    setView("setup");
  }, [resetSession, setSetupStep, setView]);

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

  useEffect(() => {
    const updateWheelSize = () => {
      setSingleWheelSize(Math.min(420, Math.max(300, window.innerWidth * 0.78)));
    };

    updateWheelSize();
    window.addEventListener("resize", updateWheelSize);
    return () => window.removeEventListener("resize", updateWheelSize);
  }, []);

  const allWinners = groupStates.flatMap((s) => s.winners);
  const lastCycleWinners = session.cycles[session.cycles.length - 1]?.groups.flatMap((g) => g.winners) ?? [];

  if (!activeGroup || !activeState) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-300">
        Aucun groupe disponible pour ce cycle.
      </div>
    );
  }

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
            Groupe {safeActiveGroupIndex + 1}/{cycle.groups.length}
          </p>
        </div>
        <div className="w-24" />
      </div>

      {/* Main drawing area */}
      {allGroupsDone ? (
        // Between cycles
        <div className="flex flex-col items-center justify-center py-12 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl text-center"
          >
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-white mb-2">Cycle terminé !</h3>
            <div className="grid gap-3 text-left sm:grid-cols-2">
              {cycle.groups.map((group, index) => (
                <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h4 className="min-w-0 truncate text-sm font-semibold text-white">{group.name}</h4>
                    <button
                      onClick={() => handleReplayGroup(index)}
                      className="shrink-0 rounded-lg border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
                    >
                      Rejouer
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(groupStates[index]?.winners ?? []).map((w) => (
                      <div key={w.id} className="flex items-center gap-1.5 rounded-lg bg-fuchsia-500/20 px-2.5 py-1.5">
                        <ParticipantAvatar id={w.id} name={w.name} size={22} color={w.assignedColor} />
                        <span className="text-xs font-medium text-white">{w.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleReplayFullDraw}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <RotateCcw size={18} />
              Rejouer tout le tirage
            </button>
            <button
              onClick={handleEditGroups}
              className="flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Modifier les groupes
            </button>
            <button
              onClick={() => {
                if (isLastCycle) {
                  setShowFinalReveal(true);
                  return;
                }
                prepareNextCycle();
                setView("overview");
              }}
              className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 font-bold text-white shadow-xl shadow-fuchsia-500/30 transition-all hover:from-fuchsia-500 hover:to-violet-500"
            >
              <Play size={20} fill="currentColor" />
              {isLastCycle ? "Voir le résultat final" : "Lancer le cycle suivant"}
            </button>
          </div>
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
              wheelSize={singleWheelSize}
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
                          size={156}
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
  wheelSize,
}: {
  group: DrawGroup;
  state: GroupDrawState;
  onStart: () => void;
  onSpinDone: () => void;
  onRevealDone: () => void;
  useShuffleMode: boolean;
  wheelSize: number;
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
            size={wheelSize}
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
