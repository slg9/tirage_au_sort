"use client";
import { Maximize2, Minimize2 } from "lucide-react";
import { useFullscreen } from "@/hooks/useFullscreen";

export function FullscreenButton() {
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-slate-300 hover:text-white"
      title={isFullscreen ? "Quitter le plein écran (F)" : "Plein écran (F)"}
    >
      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </button>
  );
}
