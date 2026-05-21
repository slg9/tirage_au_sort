"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Participant } from "@/lib/types";
import { WHEEL_COLORS } from "@/lib/draw";
import { useSounds } from "@/hooks/useSounds";
import { useHaptics } from "@/hooks/useHaptics";

type Props = {
  participants: Participant[];
  winnerId: string | null; // pre-determined winner id
  isSpinning: boolean;
  onDone: () => void;
  size?: number;
};

const TOTAL_ROTATIONS = 7;
const SPIN_DURATION = 5200;
const REVEAL_DELAY = 650;

export function WheelDraw({ participants, winnerId, isSpinning, onDone, size = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const animStartRef = useRef(0);
  const rafRef = useRef(0);
  const lastTickSegmentRef = useRef(-1);
  const isDoneRef = useRef(false);
  const { playTick, playDing } = useSounds();
  const { tick, winnerReveal } = useHaptics();

  const segmentAngle = (2 * Math.PI) / participants.length;

  const winnerIndex = useMemo(() => {
    if (!winnerId) return 0;
    return Math.max(0, participants.findIndex((p) => p.id === winnerId));
  }, [participants, winnerId]);

  const drawWheel = useCallback((rotation: number, lit: number, final = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = size / 2;
    const cx = r, cy = r;
    const outerRadius = r - 14;
    const innerRadius = Math.max(36, r * 0.15);
    const labelRadius = r * 0.62;

    ctx.clearRect(0, 0, size, size);

    const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    bg.addColorStop(0, "rgba(255,255,255,0.12)");
    bg.addColorStop(0.62, "rgba(217,70,239,0.08)");
    bg.addColorStop(1, "rgba(10,10,26,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw segments
    participants.forEach((p, i) => {
      const startAngle = rotation + i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      const isLit = i === lit;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = isLit ? 1 : 0.86;
      if (isLit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = final ? 34 : 22;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.globalAlpha = 1;

      // Segment border
      ctx.strokeStyle = "rgba(10,10,26,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const gloss = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
      gloss.addColorStop(0, "rgba(255,255,255,0.18)");
      gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Text
      const textAngle = startAngle + segmentAngle / 2;
      const tx = cx + labelRadius * Math.cos(textAngle);
      const ty = cy + labelRadius * Math.sin(textAngle);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.max(9, Math.min(15, (r * 0.38) / Math.max(1, Math.sqrt(participants.length))));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 5;
      const maxLen = Math.max(6, Math.floor(18 / Math.sqrt(participants.length)));
      const label = p.name.length > maxLen ? p.name.slice(0, maxLen - 1) + "…" : p.name;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    ctx.shadowBlur = 0;

    // Inner cutout
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#0a0a1a";
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.85)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(16, r * 0.07), 0, 2 * Math.PI);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius + 7, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 10;
    ctx.shadowColor = "rgba(251,191,36,0.95)";
    ctx.shadowBlur = final ? 24 : 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < participants.length; i += 1) {
      const angle = rotation + i * segmentAngle - Math.PI / 2;
      const x = cx + (outerRadius + 7) * Math.cos(angle);
      const y = cy + (outerRadius + 7) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, size * 0.008), 0, 2 * Math.PI);
      ctx.fillStyle = i === lit ? "#fff7ed" : "rgba(255,255,255,0.58)";
      ctx.fill();
    }
  }, [participants, segmentAngle, size]);

  // Idle rotation
  useEffect(() => {
    if (isSpinning || isDoneRef.current) return;
    let start = 0;
    let raf = 0;
    const animate = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start;
      const idleRotation = (elapsed / 30000) * 2 * Math.PI;
      rotationRef.current = idleRotation;
      const currentSegment = Math.floor(((2 * Math.PI - (idleRotation % (2 * Math.PI))) / (2 * Math.PI)) * participants.length) % participants.length;
      drawWheel(idleRotation, currentSegment);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [drawWheel, isSpinning, participants.length]);

  // Spin animation
  useEffect(() => {
    if (!isSpinning) return;
    isDoneRef.current = false;

    // Calculate target: land on winner segment + extra full spins
    // The pointer is at top (angle = -PI/2 from canvas perspective)
    // Segment i starts at rotation + i*segAngle - PI/2
    // We want pointer (top) to be in the middle of segment winnerIndex
    const currentRot = rotationRef.current % (2 * Math.PI);
    const targetSegmentAngle = -(winnerIndex * segmentAngle) + (segmentAngle / 2);
    let deltaToTarget = (targetSegmentAngle - currentRot) % (2 * Math.PI);
    if (deltaToTarget <= 0) deltaToTarget += 2 * Math.PI;

    const totalSpin = TOTAL_ROTATIONS * 2 * Math.PI + deltaToTarget;
    targetRotationRef.current = rotationRef.current + totalSpin;
    animStartRef.current = 0;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4.5);

    const animate = (timestamp: number) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const easedProgress = easeOut(progress);

      const startRot = targetRotationRef.current - totalSpin;
      rotationRef.current = startRot + totalSpin * easedProgress;

      // Detect segment changes for tick sound
      const currentSegment = Math.floor(((2 * Math.PI - ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)) * participants.length) % participants.length;
      if (currentSegment !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentSegment;
        const speed = 1 - progress;
        playTick(speed);
        tick();
      }

      drawWheel(rotationRef.current, currentSegment);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        isDoneRef.current = true;
        drawWheel(rotationRef.current, winnerIndex, true);
        playDing();
        winnerReveal();
        setTimeout(onDone, REVEAL_DELAY);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawWheel, isSpinning, onDone, participants.length, playDing, playTick, segmentAngle, tick, winnerId, winnerIndex, winnerReveal]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full bg-fuchsia-500/10 blur-2xl" />
      <canvas ref={canvasRef} className="relative rounded-full drop-shadow-2xl" />

      {/* Pointer */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2"
        style={{ zIndex: 10 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: `${Math.max(9, size * 0.032)}px solid transparent`,
            borderRight: `${Math.max(9, size * 0.032)}px solid transparent`,
            borderTop: `${Math.max(24, size * 0.075)}px solid #fbbf24`,
            filter: "drop-shadow(0 3px 10px rgba(251,191,36,0.9))",
          }}
        />
      </div>
    </div>
  );
}
