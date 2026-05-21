import { DrawGroup, Cycle, Session } from "./types";

export type ValidationError = {
  field: string;
  message: string;
};

export function validateGroup(group: DrawGroup): ValidationError[] {
  const errors: ValidationError[] = [];
  if (group.participants.length < 2) {
    errors.push({ field: "participants", message: "Minimum 2 participants requis" });
  }
  if (group.winnersCount < 1) {
    errors.push({ field: "winnersCount", message: "Au moins 1 gagnant requis" });
  }
  if (group.winnersCount >= group.participants.length) {
    errors.push({ field: "winnersCount", message: "Doit être inférieur au nombre de participants" });
  }
  return errors;
}

export function isGroupValid(group: DrawGroup): boolean {
  return validateGroup(group).length === 0;
}

export function isCycleValid(cycle: Cycle): boolean {
  if (cycle.groups.length === 0) return false;
  return cycle.groups.every(isGroupValid);
}

export function validateSessionForStart(session: Session): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!session.name.trim()) {
    errors.push({ field: "name", message: "Nom de session requis" });
  }

  if (session.participantsPool.length < 2) {
    errors.push({ field: "pool", message: "Au moins 2 participants requis" });
  }

  const cycle0 = session.cycles[0];
  if (!cycle0 || cycle0.groups.length === 0) {
    errors.push({ field: "cycle0", message: "Configurez au moins un groupe pour le cycle 1" });
  }

  if (cycle0) {
    // Check all pool participants are assigned
    const assignedIds = new Set<string>();
    cycle0.groups.forEach((g) => g.participants.forEach((p) => assignedIds.add(p.id)));
    const unassigned = session.participantsPool.filter((p) => !assignedIds.has(p.id));
    if (unassigned.length > 0) {
      errors.push({
        field: "unassigned",
        message: `${unassigned.length} participant(s) non assigné(s) — assignez-les ou supprimez-les du pool`,
      });
    }

    cycle0.groups.forEach((g, i) => {
      const groupErrors = validateGroup(g);
      groupErrors.forEach((e) => {
        errors.push({ field: `cycle0.group${i}`, message: `Groupe "${g.name}": ${e.message}` });
      });
    });
  }

  // Validate subsequent cycles
  session.cycles.slice(1).forEach((cycle, i) => {
    cycle.groups.forEach((g) => {
      if (g.winnersCount < 1) {
        errors.push({
          field: `cycle${i + 1}`,
          message: `Cycle ${i + 2}: winnersCount doit être >= 1`,
        });
      }
    });
  });

  return errors;
}

export function getUnassignedParticipants(session: Session): string[] {
  if (!session.cycles[0]) return [];
  const assignedIds = new Set<string>();
  session.cycles[0].groups.forEach((g) =>
    g.participants.forEach((p) => assignedIds.add(p.id))
  );
  return session.participantsPool
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => p.name);
}
