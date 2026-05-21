"use client";
import { useDraggable } from "@dnd-kit/core";
import { Edit2, GripVertical, X } from "lucide-react";
import { Participant } from "@/lib/types";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";

type Props = {
  participant: Participant;
  isDragging?: boolean;
  compact?: boolean;
  onRemove?: () => void;
  removeTitle?: string;
  onEdit?: () => void;
};

export function DraggableParticipantCard({ participant, compact, onRemove, removeTitle, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: participant.id,
    data: { type: "participant", participant },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing transition-all duration-150 group select-none
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
      <span className="min-w-0 flex-1 text-sm text-white truncate">{participant.name}</span>
      {onEdit && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
          title="Modifier le nom"
          aria-label="Modifier le nom"
        >
          <Edit2 size={13} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title={removeTitle}
          aria-label={removeTitle}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export function StaticParticipantCard({ participant, compact }: { participant: Participant; compact?: boolean }) {
  return (
    <div className={`min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 select-none ${compact ? "py-1.5" : ""}`}>
      <ParticipantAvatar
        id={participant.id}
        name={participant.name}
        size={compact ? 24 : 32}
        color={participant.assignedColor}
      />
      <span className="min-w-0 flex-1 text-sm text-white truncate">{participant.name}</span>
    </div>
  );
}
