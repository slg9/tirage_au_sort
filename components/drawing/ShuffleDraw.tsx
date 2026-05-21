"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Participant } from "@/lib/types";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";
import { useSounds } from "@/hooks/useSounds";

type Props = {
  participants: Participant[];
  winnerId: string;
  isRunning: boolean;
  onDone: () => void;
};

export function ShuffleDraw({ participants, winnerId, isRunning, onDone }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const { playDing } = useSounds();
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    setLocked(null);

    const available = participants.map((p) => p.id);
    let interval = 80;
    let elapsed = 0;
    let phase = 0; // 0: fast (2s), 1: slow (1s), 2: done

    const tick = () => {
      const randomId = available[Math.floor(Math.random() * available.length)];
      setHighlighted(randomId);

      if (phase === 0) {
        elapsed += interval;
        if (elapsed >= 2000) { phase = 1; elapsed = 0; interval = 200; }
      } else if (phase === 1) {
        elapsed += interval;
        if (elapsed >= 1000) {
          phase = 2;
          setHighlighted(winnerId);
          setLocked(winnerId);
          playDing();
          setTimeout(onDone, 1200);
          return;
        }
      }

      rafRef.current = setTimeout(tick, interval);
    };

    rafRef.current = setTimeout(tick, interval);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [isRunning, winnerId]);

  const cols = Math.ceil(Math.sqrt(participants.length * 1.5));

  return (
    <div
      className="grid gap-2 p-4 max-h-[500px] overflow-y-auto"
      style={{ gridTemplateColumns: `repeat(${Math.min(cols, 8)}, minmax(0, 1fr))` }}
    >
      {participants.map((p) => {
        const isHighlighted = highlighted === p.id && locked !== p.id;
        const isWinner = locked === p.id;

        return (
          <motion.div
            key={p.id}
            animate={{
              scale: isWinner ? 1.2 : isHighlighted ? 1.05 : 1,
              opacity: locked && !isWinner ? 0.4 : 1,
            }}
            transition={{ duration: 0.1 }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-default
              ${isWinner
                ? "border-amber-400/60 bg-amber-400/20 shadow-lg shadow-amber-400/30"
                : isHighlighted
                ? "border-fuchsia-500/60 bg-fuchsia-500/20"
                : "border-white/10 bg-white/3"
              }`}
          >
            <ParticipantAvatar id={p.id} name={p.name} size={32} color={p.assignedColor} />
            <span className="text-xs text-white truncate w-full text-center">{p.name}</span>
            {isWinner && <span className="text-amber-400 text-lg">👑</span>}
          </motion.div>
        );
      })}
    </div>
  );
}
