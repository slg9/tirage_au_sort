export type Participant = {
  id: string;
  name: string;
  assignedColor?: string;
};

export type DrawGroup = {
  id: string;
  name: string;
  participants: Participant[];
  winnersCount: number;
  winners: Participant[];
  status: "pending" | "drawing" | "done";
};

export type Cycle = {
  id: string;
  index: number;
  name: string;
  groups: DrawGroup[];
  status: "pending" | "running" | "done";
  splitMode: "merged" | "subgroups";
};

export type Session = {
  id: string;
  name: string;
  participantsPool: Participant[];
  cycles: Cycle[];
  currentCycleIndex: number;
  createdAt: number;
};

export type AppView = "setup" | "overview" | "drawing";

export type SetupStep = "pool" | "groups";
