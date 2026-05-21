"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Grid3X3 } from "lucide-react";
import { PoolImport } from "./PoolImport";
import { GroupComposer } from "./GroupComposer";
import { useStore } from "@/lib/store";

const steps = [
  { id: "pool", label: "Participants", icon: Users },
  { id: "groups", label: "Groupes", icon: Grid3X3 },
] as const;

export function SessionSetup() {
  const setupStep = useStore((s) => s.setupStep);
  const setSetupStep = useStore((s) => s.setSetupStep);
  const session = useStore((s) => s.session);

  const poolCount = session?.participantsPool.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = setupStep === step.id;
          const isDone = steps.findIndex((s) => s.id === setupStep) > i;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-5 sm:w-12 h-px transition-all ${isDone ? "bg-fuchsia-500" : "bg-white/10"}`} />
              )}
              <button
                onClick={() => { if (step.id === "groups" && poolCount < 2) return; setSetupStep(step.id); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                    : isDone
                    ? "bg-white/10 text-white"
                    : "bg-white/5 text-slate-500"
                  }`}
              >
                <Icon size={16} />
                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-3 sm:p-5 lg:p-6 backdrop-blur-sm shadow-xl">
        <AnimatePresence mode="wait">
          {setupStep === "pool" ? (
            <motion.div
              key="pool"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Importer les participants
              </h2>
              <PoolImport />
            </motion.div>
          ) : (
            <motion.div
              key="groups"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Composer les groupes
              </h2>
              <GroupComposer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
