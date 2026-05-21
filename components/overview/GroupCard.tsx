"use client";
import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { DrawGroup } from "@/lib/types";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";

type Props = {
  group: DrawGroup;
  compact?: boolean;
};

export function GroupCard({ group, compact }: Props) {
  const isDone = group.status === "done";
  const isRunning = group.status === "drawing";

  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 transition-all duration-300
        ${isDone
          ? "border-emerald-500/40 bg-emerald-500/5"
          : isRunning
          ? "border-fuchsia-500/60 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20"
          : "border-white/10 bg-white/3"
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-300 truncate">{group.name}</span>
        <span className="text-xs text-slate-500 shrink-0 ml-2">
          {group.participants.length} <Users className="inline" size={10} />
        </span>
      </div>

      {isDone ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-amber-400 mb-1">
            <Crown size={10} />
            {group.winners.length} gagnant(s)
          </div>
          {group.winners.map((w) => (
            <div key={w.id} className="flex items-center gap-2">
              <ParticipantAvatar id={w.id} name={w.name} size={compact ? 20 : 28} color={w.assignedColor} />
              <span className={`text-white font-medium truncate ${compact ? "text-xs" : "text-sm"}`}>{w.name}</span>
            </div>
          ))}
        </div>
      ) : isRunning ? (
        <div className="flex items-center gap-2 text-xs text-fuchsia-400">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          Tirage en cours...
        </div>
      ) : (
        <div className="text-xs text-slate-600">En attente</div>
      )}
    </motion.div>
  );
}
