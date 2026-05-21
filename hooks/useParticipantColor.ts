"use client";
import { useStore } from "@/lib/store";
import { WINNER_COLORS } from "@/lib/draw";

let assignedCount = 0;

export function useParticipantColor() {
  const assignColor = useStore((s) => s.assignWinnerColor);

  const getOrAssignColor = (participantId: string, existingColor?: string): string => {
    if (existingColor) return existingColor;
    const color = WINNER_COLORS[assignedCount % WINNER_COLORS.length];
    assignedCount++;
    assignColor(participantId, color);
    return color;
  };

  return { getOrAssignColor };
}
