"use client";
import { Volume2, VolumeX } from "lucide-react";
import { useStore } from "@/lib/store";

export function SoundToggle() {
  const isMuted = useStore((s) => s.isMuted);
  const toggleMute = useStore((s) => s.toggleMute);

  return (
    <button
      onClick={toggleMute}
      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-white"
      title={isMuted ? "Activer le son" : "Couper le son"}
    >
      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
