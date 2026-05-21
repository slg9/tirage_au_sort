"use client";
import { Vibrate } from "lucide-react";
import { useStore } from "@/lib/store";

export function HapticToggle() {
  const isHapticsEnabled = useStore((s) => s.isHapticsEnabled);
  const toggleHaptics = useStore((s) => s.toggleHaptics);

  return (
    <button
      onClick={toggleHaptics}
      className={`p-2 rounded-lg border border-white/10 transition-all duration-200 ${
        isHapticsEnabled
          ? "bg-white/10 text-white"
          : "bg-white/5 text-slate-500"
      }`}
      title={isHapticsEnabled ? "Désactiver les vibrations" : "Activer les vibrations"}
    >
      <Vibrate size={18} />
    </button>
  );
}
