"use client";
import { useDroppable } from "@dnd-kit/core";
import { useState, KeyboardEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Users } from "lucide-react";
import { DrawGroup } from "@/lib/types";
import { DraggableParticipantCard } from "./ParticipantCard";
import { useStore } from "@/lib/store";
import { isGroupValid } from "@/lib/validation";

type Props = {
  group: DrawGroup;
  cycleId: string;
  dragHandle?: ReactNode;
};

export function GroupDropZone({ group, cycleId, dragHandle }: Props) {
  const renameGroup = useStore((s) => s.renameGroup);
  const removeGroup = useStore((s) => s.removeGroup);
  const setWinnersCount = useStore((s) => s.setWinnersCount);
  const quickAddToGroup = useStore((s) => s.quickAddToGroup);
  const unassignParticipantFromGroup = useStore((s) => s.unassignParticipantFromGroup);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(group.name);
  const [quickAdd, setQuickAdd] = useState("");

  const { isOver, setNodeRef } = useDroppable({ id: group.id, data: { groupId: group.id } });
  const valid = isGroupValid(group);
  const tooFew = group.participants.length < 2;
  const tooManyWinners = group.winnersCount >= group.participants.length;

  const borderColor = tooFew || tooManyWinners
    ? "border-red-500/60"
    : valid
    ? "border-emerald-500/40"
    : "border-white/10";

  const handleQuickAdd = () => {
    if (!quickAdd.trim()) return;
    quickAddToGroup(cycleId, group.id, quickAdd.trim());
    setQuickAdd("");
  };

  const handleQuickAddKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleQuickAdd();
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-white/3 transition-all duration-200 min-h-[240px] max-h-[420px] md:max-h-[460px]
        ${borderColor}
        ${isOver ? "bg-fuchsia-500/10 border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/20" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3 pb-2 border-b border-white/5">
        {dragHandle && (
          dragHandle
        )}
        {isEditingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => { renameGroup(cycleId, group.id, nameInput || group.name); setIsEditingName(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { renameGroup(cycleId, group.id, nameInput || group.name); setIsEditingName(false); } }}
            className="min-w-0 flex-1 bg-transparent text-white text-sm font-medium outline-none border-b border-fuchsia-500"
          />
        ) : (
          <button
            onClick={() => { setNameInput(group.name); setIsEditingName(true); }}
            className="min-w-0 flex-1 text-left text-sm font-medium text-white hover:text-fuchsia-300 transition-colors truncate"
          >
            {group.name}
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-slate-400">Gagnants:</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, group.participants.length - 1)}
            value={group.winnersCount}
            onChange={(e) => setWinnersCount(cycleId, group.id, Math.max(1, parseInt(e.target.value) || 1))}
            className="w-10 text-center bg-white/10 border border-white/20 rounded text-white text-xs py-0.5 focus:outline-none focus:border-fuchsia-500"
          />
        </div>

        <button
          onClick={() => removeGroup(cycleId, group.id)}
          className="text-slate-500 hover:text-red-400 transition-colors ml-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Participants */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {group.participants.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              onDoubleClick={() => unassignParticipantFromGroup(p.id, group.id)}
            >
                <DraggableParticipantCard
                  participant={p}
                  compact
                  onRemove={() => unassignParticipantFromGroup(p.id, group.id)}
                  removeTitle="Retirer du groupe"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {group.participants.length === 0 && (
          <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
            Glissez des participants ici
          </div>
        )}
      </div>

      {/* Quick add */}
      <div className="px-2 pb-2 flex gap-1 shrink-0">
        <input
          type="text"
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          onKeyDown={handleQuickAddKey}
          placeholder="Ajouter un prénom..."
          className="min-w-0 flex-1 text-xs px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-fuchsia-500/50"
        />
        <button
          onClick={handleQuickAdd}
          disabled={!quickAdd.trim()}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-40 text-slate-400 hover:text-white transition-all border border-white/10"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 pb-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Users size={12} />
          {group.participants.length} · {group.winnersCount} gagnant(s)
        </div>
        {tooFew && <span className="text-xs text-red-400 text-right">Min. 2 participants</span>}
        {!tooFew && tooManyWinners && <span className="text-xs text-red-400 text-right">Trop de gagnants</span>}
      </div>
    </div>
  );
}
