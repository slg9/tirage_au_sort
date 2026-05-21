import { Participant } from "./types";

export function drawWinners(participants: Participant[], count: number): Participant[] {
  const pool = [...participants];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function distributeEqually<T>(items: T[], groupCount: number): T[][] {
  const shuffled = fisherYatesShuffle(items);
  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((item, i) => {
    groups[i % groupCount].push(item);
  });
  return groups;
}

// Colors palette for assigned winner colors
export const WINNER_COLORS = [
  "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981",
  "#f97316", "#ef4444", "#3b82f6", "#84cc16", "#a78bfa",
  "#fb7185", "#34d399",
];

let colorIndex = 0;
export function getNextWinnerColor(): string {
  const color = WINNER_COLORS[colorIndex % WINNER_COLORS.length];
  colorIndex++;
  return color;
}

export function resetColorIndex() {
  colorIndex = 0;
}

// Wheel segment colors
export const WHEEL_COLORS = [
  "#c026d3", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#e11d48", "#4f46e5", "#0f766e",
];
