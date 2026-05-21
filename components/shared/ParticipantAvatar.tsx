"use client";
import { useMemo } from "react";

type Props = {
  id: string;
  name: string;
  size?: number;
  color?: string;
};

// Simple avatar using initials + color derived from id
function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#c026d3", "#7c3aed", "#0891b2", "#059669",
    "#d97706", "#e11d48", "#4f46e5", "#0f766e",
    "#dc2626", "#2563eb", "#16a34a", "#9333ea",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function ParticipantAvatar({ id, name, size = 40, color }: Props) {
  const bgColor = useMemo(() => color || hashColor(id), [id, color]);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const fontSize = Math.max(10, size * 0.38);

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: bgColor,
        fontSize,
        boxShadow: `0 0 ${size * 0.3}px ${bgColor}60`,
      }}
    >
      {initials || "?"}
    </div>
  );
}
