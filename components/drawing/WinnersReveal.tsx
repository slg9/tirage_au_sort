"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Participant } from "@/lib/types";
import { ParticipantAvatar } from "@/components/shared/ParticipantAvatar";
import { fireConfetti, fireGrandWinnerConfetti } from "@/components/shared/Confetti";

type Props = {
  winners: Participant[];
  isGrandFinal?: boolean;
  onNewSession?: () => void;
  onRestart?: () => void;
};

export function WinnersReveal({ winners, isGrandFinal, onNewSession, onRestart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGrandFinal) {
      fireGrandWinnerConfetti();
    } else {
      fireConfetti();
    }
  }, [isGrandFinal]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-6xl mb-4"
      >
        {isGrandFinal ? "🏆" : "🎉"}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold mb-2"
        style={{
          background: "linear-gradient(90deg, #fde68a, #f472b6, #a78bfa, #22d3ee)",
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "gradientShift 3s linear infinite",
        }}
      >
        {isGrandFinal
          ? `Grand${winners.length > 1 ? "s" : ""} gagnant${winners.length > 1 ? "s" : ""} !`
          : `Gagnant${winners.length > 1 ? "s" : ""} !`}
      </motion.h2>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {winners.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border
              ${isGrandFinal ? "border-amber-400/40 bg-amber-400/10" : "border-fuchsia-500/30 bg-fuchsia-500/10"}`}
          >
            <ParticipantAvatar
              id={w.id}
              name={w.name}
              size={isGrandFinal ? 80 : 64}
              color={w.assignedColor}
            />
            <span className={`font-bold text-white ${isGrandFinal ? "text-2xl" : "text-xl"}`}>
              {w.name}
            </span>
            {isGrandFinal && <span className="text-2xl">👑</span>}
          </motion.div>
        ))}
      </div>

      {isGrandFinal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex gap-4 mt-10"
        >
          {onRestart && (
            <button
              onClick={onRestart}
              className="px-6 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-all"
            >
              Recommencer
            </button>
          )}
          {onNewSession && (
            <button
              onClick={onNewSession}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold transition-all"
            >
              Nouvelle session
            </button>
          )}
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  );
}
