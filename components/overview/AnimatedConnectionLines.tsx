"use client";
import { motion } from "framer-motion";

type Props = {
  count: number;
};

export function AnimatedConnectionLines({ count }: Props) {
  return (
    <div className="flex flex-col items-center justify-center w-16 shrink-0">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Arrow */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-8 bg-gradient-to-b from-fuchsia-500/60 to-violet-500/60" />
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-fuchsia-500"
          />
        </div>
        {count > 0 && (
          <span className="absolute -top-2 text-xs text-fuchsia-400 bg-slate-900 px-1">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
