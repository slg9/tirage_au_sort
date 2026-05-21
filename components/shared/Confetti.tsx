"use client";
import confetti from "canvas-confetti";

const COLORS = ["#fbbf24", "#f472b6", "#a78bfa", "#22d3ee", "#fde68a"];

export function fireConfetti(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: origin ?? { x: 0.5, y: 0.5 },
    colors: COLORS,
    shapes: ["circle", "square"],
    startVelocity: 30,
    ticks: 100,
  });
}

export function fireGrandWinnerConfetti() {
  const origins = [
    { x: 0.2, y: 0.6 },
    { x: 0.5, y: 0.5 },
    { x: 0.8, y: 0.6 },
  ];
  origins.forEach((origin, i) => {
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 360,
        origin,
        colors: COLORS,
        shapes: ["circle", "square", "star"],
        startVelocity: 30,
        ticks: 200,
      });
    }, i * 200);
  });
}

export function fireElementConfetti(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  fireConfetti({ x, y });
}
