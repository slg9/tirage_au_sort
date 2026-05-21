"use client";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertCircle, Play, ChevronLeft } from "lucide-react";
import { Participant } from "@/lib/types";
import { ParticipantPool } from "./ParticipantPool";
import { GroupDropZone } from "./GroupDropZone";
import { AdvancedCycleConfig } from "./AdvancedCycleConfig";
import { StaticParticipantCard } from "./ParticipantCard";
import { useStore } from "@/lib/store";
import { validateSessionForStart } from "@/lib/validation";

export function GroupComposer() {
  const session = useStore((s) => s.session);
  const addGroup = useStore((s) => s.addGroup);
  const addCycle = useStore((s) => s.addCycle);
  const removeCycle = useStore((s) => s.removeCycle);
  const assignParticipantToGroup = useStore((s) => s.assignParticipantToGroup);
  const unassignParticipantFromGroup = useStore((s) => s.unassignParticipantFromGroup);
  const startSession = useStore((s) => s.startSession);
  const setSetupStep = useStore((s) => s.setSetupStep);

  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!session) return null;

  const cycle0 = session.cycles[0];
  const laterCycles = session.cycles.slice(1);

  // Compute unassigned participants
  const assignedIds = new Set<string>();
  cycle0?.groups.forEach((g) => g.participants.forEach((p) => assignedIds.add(p.id)));
  const unassigned = session.participantsPool.filter((p) => !assignedIds.has(p.id));

  const errors = validateSessionForStart(session);
  const canStart = errors.length === 0;

  const handleDragStart = (event: DragStartEvent) => {
    const p = event.active.data.current?.participant as Participant;
    setActiveParticipant(p ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveParticipant(null);
    const { active, over } = event;
    if (!over) return;

    const participantId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;

    if (overData?.isPool) {
      // Find which group this participant is in
      const sourceGroup = cycle0?.groups.find((g) => g.participants.some((p) => p.id === participantId));
      if (sourceGroup) {
        unassignParticipantFromGroup(participantId, sourceGroup.id);
      }
    } else if (overData?.groupId) {
      assignParticipantToGroup(participantId, overData.groupId);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSetupStep("pool")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          Retour au pool
        </button>

        {/* Cycle 0 composition */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: pool */}
          <div className="lg:w-64 xl:w-72 shrink-0">
            <div className="sticky top-4 bg-white/3 border border-white/10 rounded-xl p-4 h-fit max-h-[calc(100vh-200px)] flex flex-col">
              {cycle0 && (
                <ParticipantPool
                  participants={unassigned}
                  total={session.participantsPool.length}
                  cycleId={cycle0.id}
                />
              )}
            </div>
          </div>

          {/* Right: groups */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">
                Groupes — Cycle 1
              </h3>
              {cycle0 && (
                <button
                  onClick={() => addGroup(cycle0.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm border border-white/10 transition-all"
                >
                  <Plus size={14} />
                  Ajouter un groupe
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {cycle0?.groups.map((group) => (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <GroupDropZone group={group} cycleId={cycle0.id} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Later cycles */}
        {session.cycles.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">Cycles suivants</h3>
            </div>
            {laterCycles.map((cycle) => {
              const prevCycle = session.cycles.find((c) => c.index === cycle.index - 1);
              const prevWinners = prevCycle?.groups.flatMap((g) => g.winners) ?? [];
              // For config purposes, use pool participants count as preview
              const previewWinners = prevWinners.length > 0
                ? prevWinners
                : (prevCycle?.groups.flatMap((g) => g.participants.slice(0, g.winnersCount)) ?? []);

              return (
                <div key={cycle.id} className="relative">
                  <AdvancedCycleConfig cycle={cycle} prevCycleWinners={previewWinners} />
                  <button
                    onClick={() => removeCycle(cycle.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs flex items-center justify-center transition-all"
                    title="Supprimer ce cycle"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add cycle */}
        <button
          onClick={addCycle}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-slate-500 hover:text-slate-300 hover:border-white/40 text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={14} />
          Ajouter un cycle suivant
        </button>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {e.message}
              </div>
            ))}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={startSession}
          disabled={!canStart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold text-lg transition-all duration-200 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-3"
        >
          <Play size={20} fill="currentColor" />
          Démarrer la session
        </button>
      </div>

      <DragOverlay>
        {activeParticipant && <StaticParticipantCard participant={activeParticipant} />}
      </DragOverlay>
    </DndContext>
  );
}
