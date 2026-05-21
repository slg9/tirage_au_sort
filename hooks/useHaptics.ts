"use client";
import { useCallback } from "react";
import { useStore } from "@/lib/store";

export function useHaptics() {
  const isHapticsEnabled = useStore((s) => s.isHapticsEnabled);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!isHapticsEnabled) return;
      if (typeof window === "undefined") return;
      if (!("vibrate" in navigator)) return;
      navigator.vibrate(pattern);
    },
    [isHapticsEnabled]
  );

  const tick = useCallback(() => vibrate(10), [vibrate]);
  const winnerReveal = useCallback(() => vibrate([50, 30, 50, 30, 100]), [vibrate]);
  const grandWinner = useCallback(() => vibrate([100, 50, 100, 50, 200]), [vibrate]);

  return { tick, winnerReveal, grandWinner };
}
