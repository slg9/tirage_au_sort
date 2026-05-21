import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session, Cycle, DrawGroup, Participant, AppView, SetupStep } from "./types";
import { parseCsv } from "./csv";
import { drawWinners, distributeEqually, WINNER_COLORS } from "./draw";

let colorIdx = 0;
function nextColor(): string {
  return WINNER_COLORS[colorIdx++ % WINNER_COLORS.length];
}

function makeGroup(name: string, participants: Participant[] = [], winnersCount = 1): DrawGroup {
  return {
    id: crypto.randomUUID(),
    name,
    participants,
    winnersCount,
    winners: [],
    status: "pending",
  };
}

function makeCycle(index: number, groups: DrawGroup[] = []): Cycle {
  return {
    id: crypto.randomUUID(),
    index,
    name: `Cycle ${index + 1}`,
    groups,
    status: "pending",
    splitMode: "merged",
  };
}

type Store = {
  session: Session | null;
  view: AppView;
  setupStep: SetupStep;
  isMuted: boolean;
  isHapticsEnabled: boolean;

  // Session init
  createSession: (name: string) => void;
  updateSessionName: (name: string) => void;

  // Pool
  importPoolFromCsv: (csvContent: string) => { success: boolean; count: number; error?: string };
  addParticipantToPool: (name: string) => Participant;
  removeParticipantFromPool: (id: string) => void;
  renameParticipant: (id: string, newName: string) => void;
  clearPool: () => void;

  // Groups (cycle 0)
  addGroup: (cycleId: string) => void;
  removeGroup: (cycleId: string, groupId: string) => void;
  renameGroup: (cycleId: string, groupId: string, name: string) => void;
  assignParticipantToGroup: (participantId: string, targetGroupId: string, sourceCycleId?: string) => void;
  unassignParticipantFromGroup: (participantId: string, groupId: string) => void;
  quickAddToGroup: (cycleId: string, groupId: string, name: string) => void;
  autoAssignPoolToGroups: (numberOfGroups: number) => void;
  clearAllGroups: (cycleId: string) => void;
  setWinnersCount: (cycleId: string, groupId: string, count: number) => void;
  reorderGroups: (cycleId: string, groupIds: string[]) => void;

  // Advanced cycles
  addCycle: () => void;
  removeCycle: (id: string) => void;
  toggleSplitMode: (cycleId: string) => void;
  addSubgroup: (cycleId: string) => void;
  removeSubgroup: (cycleId: string, groupId: string) => void;
  assignWinnerToSubgroup: (cycleId: string, groupId: string, participantId: string) => void;
  unassignWinnerFromSubgroup: (cycleId: string, groupId: string, participantId: string) => void;

  // Session flow
  startSession: () => void;
  setView: (view: AppView) => void;
  setSetupStep: (step: SetupStep) => void;
  markGroupAsDrawn: (cycleId: string, groupId: string, winners: Participant[]) => void;
  completeCycle: (cycleId: string) => void;
  prepareNextCycle: () => void;

  // Color assignment
  assignWinnerColor: (participantId: string, color: string) => void;

  // Reset
  resetSession: () => void;
  newSession: () => void;

  // Toggles
  toggleMute: () => void;
  toggleHaptics: () => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      session: null,
      view: "setup",
      setupStep: "pool",
      isMuted: false,
      isHapticsEnabled: true,

      createSession: (name) => {
        colorIdx = 0;
        const cycle0 = makeCycle(0, [makeGroup("Groupe A")]);
        set({
          session: {
            id: crypto.randomUUID(),
            name,
            participantsPool: [],
            cycles: [cycle0],
            currentCycleIndex: 0,
            createdAt: Date.now(),
          },
          view: "setup",
          setupStep: "pool",
        });
      },

      updateSessionName: (name) =>
        set((s) => s.session ? { session: { ...s.session, name } } : {}),

      importPoolFromCsv: (csvContent) => {
        const result = parseCsv(csvContent);
        if (result.error || result.names.length === 0) {
          return { success: false, count: 0, error: result.error || "Aucun prénom détecté" };
        }
        const participants: Participant[] = result.names.map((name) => ({
          id: crypto.randomUUID(),
          name: name.trim().slice(0, 40),
        }));
        set((s) => {
          if (!s.session) return {};
          // Reset cycle0 groups participants since pool changed
          const cycles = s.session.cycles.map((c, i) =>
            i === 0
              ? { ...c, groups: c.groups.map((g) => ({ ...g, participants: [], winners: [], status: "pending" as const })) }
              : c
          );
          return { session: { ...s.session, participantsPool: participants, cycles } };
        });
        return { success: true, count: participants.length };
      },

      addParticipantToPool: (name) => {
        const p: Participant = { id: crypto.randomUUID(), name: name.trim().slice(0, 40) };
        set((s) => {
          if (!s.session) return {};
          return { session: { ...s.session, participantsPool: [...s.session.participantsPool, p] } };
        });
        return p;
      },

      removeParticipantFromPool: (id) =>
        set((s) => {
          if (!s.session) return {};
          const pool = s.session.participantsPool.filter((p) => p.id !== id);
          const cycles = s.session.cycles.map((c) => ({
            ...c,
            groups: c.groups.map((g) => ({
              ...g,
              participants: g.participants.filter((p) => p.id !== id),
            })),
          }));
          return { session: { ...s.session, participantsPool: pool, cycles } };
        }),

      renameParticipant: (id, newName) =>
        set((s) => {
          if (!s.session) return {};
          const rename = (p: Participant) => p.id === id ? { ...p, name: newName.trim().slice(0, 40) } : p;
          const pool = s.session.participantsPool.map(rename);
          const cycles = s.session.cycles.map((c) => ({
            ...c,
            groups: c.groups.map((g) => ({ ...g, participants: g.participants.map(rename) })),
          }));
          return { session: { ...s.session, participantsPool: pool, cycles } };
        }),

      clearPool: () =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c, i) =>
            i === 0 ? { ...c, groups: c.groups.map((g) => ({ ...g, participants: [] })) } : c
          );
          return { session: { ...s.session, participantsPool: [], cycles } };
        }),

      addGroup: (cycleId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            const idx = c.groups.length;
            return { ...c, groups: [...c.groups, makeGroup(`Groupe ${String.fromCharCode(65 + idx)}`)] };
          });
          return { session: { ...s.session, cycles } };
        }),

      removeGroup: (cycleId, groupId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return { ...c, groups: c.groups.filter((g) => g.id !== groupId) };
          });
          return { session: { ...s.session, cycles } };
        }),

      renameGroup: (cycleId, groupId, name) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return { ...c, groups: c.groups.map((g) => g.id === groupId ? { ...g, name } : g) };
          });
          return { session: { ...s.session, cycles } };
        }),

      assignParticipantToGroup: (participantId, targetGroupId) =>
        set((s) => {
          if (!s.session) return {};
          const participant = s.session.participantsPool.find((p) => p.id === participantId);
          if (!participant) return {};
          const cycles = s.session.cycles.map((c) => ({
            ...c,
            groups: c.groups.map((g) => {
              if (g.id === targetGroupId) {
                if (g.participants.some((p) => p.id === participantId)) return g;
                return { ...g, participants: [...g.participants, participant] };
              }
              // Remove from other groups
              return { ...g, participants: g.participants.filter((p) => p.id !== participantId) };
            }),
          }));
          return { session: { ...s.session, cycles } };
        }),

      unassignParticipantFromGroup: (participantId, groupId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => ({
            ...c,
            groups: c.groups.map((g) =>
              g.id === groupId
                ? { ...g, participants: g.participants.filter((p) => p.id !== participantId) }
                : g
            ),
          }));
          return { session: { ...s.session, cycles } };
        }),

      quickAddToGroup: (cycleId, groupId, name) => {
        const { addParticipantToPool, assignParticipantToGroup } = get();
        const p = addParticipantToPool(name);
        assignParticipantToGroup(p.id, groupId);
      },

      autoAssignPoolToGroups: (numberOfGroups) =>
        set((s) => {
          if (!s.session) return {};
          const cycle0 = s.session.cycles[0];
          if (!cycle0) return {};

          // Get unassigned participants
          const assignedIds = new Set<string>();
          cycle0.groups.forEach((g) => g.participants.forEach((p) => assignedIds.add(p.id)));
          const unassigned = s.session.participantsPool.filter((p) => !assignedIds.has(p.id));

          const distributed = distributeEqually(unassigned, numberOfGroups);
          const newGroups = distributed.map((participants, i) =>
            makeGroup(`Groupe ${String.fromCharCode(65 + i)}`, participants)
          );

          const cycles = s.session.cycles.map((c, i) =>
            i === 0 ? { ...c, groups: newGroups } : c
          );
          return { session: { ...s.session, cycles } };
        }),

      clearAllGroups: (cycleId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) =>
            c.id === cycleId
              ? { ...c, groups: c.groups.map((g) => ({ ...g, participants: [] })) }
              : c
          );
          return { session: { ...s.session, cycles } };
        }),

      setWinnersCount: (cycleId, groupId, count) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return { ...c, groups: c.groups.map((g) => g.id === groupId ? { ...g, winnersCount: count } : g) };
          });
          return { session: { ...s.session, cycles } };
        }),

      reorderGroups: (cycleId, groupIds) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            const map = new Map(c.groups.map((g) => [g.id, g]));
            const ordered = groupIds.map((id) => map.get(id)).filter(Boolean) as DrawGroup[];
            return { ...c, groups: ordered };
          });
          return { session: { ...s.session, cycles } };
        }),

      addCycle: () =>
        set((s) => {
          if (!s.session) return {};
          const idx = s.session.cycles.length;
          const prevCycle = s.session.cycles[idx - 1];
          // Pre-fill with prev cycle winners (if done) or empty
          const prevWinners = prevCycle?.groups.flatMap((g) => g.winners) ?? [];
          const newCycle = makeCycle(idx, [
            makeGroup("Groupe A", prevWinners, Math.max(1, Math.ceil(prevWinners.length / 2))),
          ]);
          return { session: { ...s.session, cycles: [...s.session.cycles, newCycle] } };
        }),

      removeCycle: (id) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles
            .filter((c) => c.id !== id)
            .map((c, i) => ({ ...c, index: i }));
          return { session: { ...s.session, cycles } };
        }),

      toggleSplitMode: (cycleId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            const newMode = c.splitMode === "merged" ? "subgroups" : "merged";
            if (newMode === "merged") {
              // Merge all participants back into one group
              const allParticipants = c.groups.flatMap((g) => g.participants);
              const unique = Array.from(new Map(allParticipants.map((p) => [p.id, p])).values());
              return { ...c, splitMode: newMode as "merged" | "subgroups", groups: [makeGroup("Groupe A", unique, 1)] };
            } else {
              // Split into 2 subgroups
              const allParticipants = c.groups.flatMap((g) => g.participants);
              const unique = Array.from(new Map(allParticipants.map((p) => [p.id, p])).values());
              return {
                ...c,
                splitMode: newMode as "merged" | "subgroups",
                groups: [
                  makeGroup("Sous-groupe A", [], 1),
                  makeGroup("Sous-groupe B", [], 1),
                ],
              };
            }
          });
          return { session: { ...s.session, cycles } };
        }),

      addSubgroup: (cycleId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            const idx = c.groups.length;
            return { ...c, groups: [...c.groups, makeGroup(`Sous-groupe ${String.fromCharCode(65 + idx)}`, [], 1)] };
          });
          return { session: { ...s.session, cycles } };
        }),

      removeSubgroup: (cycleId, groupId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            if (c.groups.length <= 2) return c; // Minimum 2 subgroups
            return { ...c, groups: c.groups.filter((g) => g.id !== groupId) };
          });
          return { session: { ...s.session, cycles } };
        }),

      assignWinnerToSubgroup: (cycleId, groupId, participantId) =>
        set((s) => {
          if (!s.session) return {};
          const cycle = s.session.cycles.find((c) => c.id === cycleId);
          if (!cycle) return {};
          const prevCycle = s.session.cycles.find((c) => c.index === cycle.index - 1);
          const prevWinners = prevCycle?.groups.flatMap((g) => g.winners) ?? [];
          const participant = prevWinners.find((p) => p.id === participantId);
          if (!participant) return {};

          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return {
              ...c,
              groups: c.groups.map((g) => {
                if (g.id === groupId) {
                  if (g.participants.some((p) => p.id === participantId)) return g;
                  return { ...g, participants: [...g.participants, participant] };
                }
                return { ...g, participants: g.participants.filter((p) => p.id !== participantId) };
              }),
            };
          });
          return { session: { ...s.session, cycles } };
        }),

      unassignWinnerFromSubgroup: (cycleId, groupId, participantId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return {
              ...c,
              groups: c.groups.map((g) =>
                g.id === groupId
                  ? { ...g, participants: g.participants.filter((p) => p.id !== participantId) }
                  : g
              ),
            };
          });
          return { session: { ...s.session, cycles } };
        }),

      startSession: () => set({ view: "overview" }),

      setView: (view) => set({ view }),

      setSetupStep: (setupStep) => set({ setupStep }),

      markGroupAsDrawn: (cycleId, groupId, winners) =>
        set((s) => {
          if (!s.session) return {};
          // Assign colors to winners
          const pool = s.session.participantsPool.map((p) => {
            if (winners.some((w) => w.id === p.id) && !p.assignedColor) {
              return { ...p, assignedColor: nextColor() };
            }
            return p;
          });
          const winnersWithColors = winners.map((w) => {
            const poolP = pool.find((p) => p.id === w.id);
            return poolP ? { ...w, assignedColor: poolP.assignedColor } : w;
          });

          const cycles = s.session.cycles.map((c) => {
            if (c.id !== cycleId) return c;
            return {
              ...c,
              groups: c.groups.map((g) =>
                g.id === groupId ? { ...g, winners: winnersWithColors, status: "done" as const } : g
              ),
            };
          });
          return { session: { ...s.session, participantsPool: pool, cycles } };
        }),

      completeCycle: (cycleId) =>
        set((s) => {
          if (!s.session) return {};
          const cycles = s.session.cycles.map((c) =>
            c.id === cycleId ? { ...c, status: "done" as const } : c
          );
          return { session: { ...s.session, cycles } };
        }),

      prepareNextCycle: () =>
        set((s) => {
          if (!s.session) return {};
          const nextIdx = s.session.currentCycleIndex + 1;
          if (nextIdx >= s.session.cycles.length) return {};

          const currentCycle = s.session.cycles[s.session.currentCycleIndex];
          const winners = currentCycle.groups.flatMap((g) => g.winners);
          const unique = Array.from(new Map(winners.map((p) => [p.id, p])).values());

          const cycles = s.session.cycles.map((c) => {
            if (c.index !== nextIdx) return c;
            if (c.splitMode === "merged") {
              const groups = [{ ...c.groups[0], participants: unique }];
              return { ...c, groups, status: "pending" as const };
            }
            return c;
          });

          return { session: { ...s.session, cycles, currentCycleIndex: nextIdx } };
        }),

      assignWinnerColor: (participantId, color) =>
        set((s) => {
          if (!s.session) return {};
          const pool = s.session.participantsPool.map((p) =>
            p.id === participantId ? { ...p, assignedColor: color } : p
          );
          return { session: { ...s.session, participantsPool: pool } };
        }),

      resetSession: () =>
        set((s) => {
          if (!s.session) return {};
          colorIdx = 0;
          const cycles = s.session.cycles.map((c, i) => ({
            ...c,
            status: "pending" as const,
            groups: c.groups.map((g) => ({ ...g, winners: [], status: "pending" as const })),
            ...(i > 0 ? { groups: c.groups.map((g) => ({ ...g, participants: [], winners: [], status: "pending" as const })) } : {}),
          }));
          const pool = s.session.participantsPool.map((p) => ({ ...p, assignedColor: undefined }));
          return {
            session: { ...s.session, cycles, currentCycleIndex: 0, participantsPool: pool },
            view: "overview",
          };
        }),

      newSession: () => {
        colorIdx = 0;
        set({ session: null, view: "setup", setupStep: "pool" });
      },

      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      toggleHaptics: () => set((s) => ({ isHapticsEnabled: !s.isHapticsEnabled })),
    }),
    {
      name: "tirage-au-sort-store",
      partialize: (state) => ({
        session: state.session,
        view: state.view === "drawing" ? "overview" : state.view,
        isMuted: state.isMuted,
        isHapticsEnabled: state.isHapticsEnabled,
      }),
    }
  )
);
