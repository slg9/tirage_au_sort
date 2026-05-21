"use client";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { Participant } from "@/lib/types";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";

type Props = {
  participant: Participant;
  isDragging?: boolean;
  compact?: boolean;
};

export function DraggableParticipantCard({ participant, compact }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: participant.id,
    data: { participant },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing transition-all duration-150 group select-none
        ${isDragging ? "opacity-0" : "hover:bg-white/8 hover:border-white/20"}
        ${compact ? "py-1.5" : ""}`}
    >
      <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
        <GripVertical size={14} />
      </div>
      <ParticipantAvatar
        id={participant.id}
        name={participant.name}
        size={compact ? 24 : 32}
        color={participant.assignedColor}
      />
      <span className="flex-1 text-sm text-white truncate">{participant.name}</span>
    </div>
  );
}

export function StaticParticipantCard({ participant, compact }: { participant: Participant; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 select-none ${compact ? "py-1.5" : ""}`}>
      <ParticipantAvatar
        id={participant.id}
        name={participant.name}
        size={compact ? 24 : 32}
        color={participant.assignedColor}
      />
      <span className="flex-1 text-sm text-white truncate">{participant.name}</span>
    </div>
  );
}
