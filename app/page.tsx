"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { SessionSetup } from "@/components/setup/SessionSetup";
import { BracketView } from "@/components/overview/BracketView";
import { DrawingScreen } from "@/components/drawing/DrawingScreen";
import { SoundToggle } from "@/components/shared/SoundToggle";
import { HapticToggle } from "@/components/shared/HapticToggle";
import { FullscreenButton } from "@/components/shared/FullscreenButton";

export default function Home() {
  const session = useStore((s) => s.session);
  const view = useStore((s) => s.view);
  const createSession = useStore((s) => s.createSession);

  // Auto-create a session if none exists
  useEffect(() => {
    if (!session) {
      createSession("Ma session");
    }
  }, [session, createSession]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎡</span>
            <span className="font-bold text-white text-sm hidden sm:block">
              {session?.name || "Tirage au sort"}
            </span>
            {view !== "setup" && (
              <ViewBadge view={view} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <HapticToggle />
            <SoundToggle />
            <FullscreenButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {view === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <SessionSetup />
            </motion.div>
          )}
          {view === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <BracketView />
            </motion.div>
          )}
          {view === "drawing" && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <DrawingScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ViewBadge({ view }: { view: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    overview: { label: "Vue d'ensemble", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    drawing: { label: "Tirage en cours", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" },
  };
  const config = labels[view];
  if (!config) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}
