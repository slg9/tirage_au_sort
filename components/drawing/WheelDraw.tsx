"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const FULL_CIRCLE = 2 * Math.PI;

function normalizeAngle(angle: number) {
  return ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

function getPointerSegment(rotation: number, count: number) {
  if (count <= 0) return 0;
  return Math.floor(normalizeAngle(-rotation) / (FULL_CIRCLE / count)) % count;
}

function getSegmentColor(index: number, count: number) {
  if (count <= WHEEL_COLORS.length) return WHEEL_COLORS[index % WHEEL_COLORS.length];
  return `hsl(${Math.round((index * 360) / count)} 78% 46%)`;
}

function fitTextToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let low = 1;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, mid)}...`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return `${text.slice(0, Math.max(1, low))}...`;
}

export function WheelDraw({ participants, winnerId, isSpinning, onDone, size = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const animStartRef = useRef(0);
  const rafRef = useRef(0);
  const lastTickSegmentRef = useRef(-1);
  const activeSegmentRef = useRef(-1);
  const isDoneRef = useRef(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const { playTick, playDing } = useSounds();
  const { tick, winnerReveal } = useHaptics();

  const segmentAngle = FULL_CIRCLE / participants.length;
  const activeParticipant = participants[activeSegment] ?? participants[0];

  const winnerIndex = useMemo(() => {
    if (!winnerId) return 0;
    return Math.max(0, participants.findIndex((p) => p.id === winnerId));
  }, [participants, winnerId]);

  const updateActiveSegment = useCallback((index: number) => {
    if (index === activeSegmentRef.current) return;
    activeSegmentRef.current = index;
    setActiveSegment(index);
  }, []);

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
    const labelStartRadius = innerRadius + Math.max(14, size * 0.045);
    const labelEndRadius = outerRadius - Math.max(32, size * 0.11);
    const labelRadius = labelStartRadius;
    const labelOffset = Math.max(5, size * 0.018);
    const maxLabelWidth = Math.max(18, labelEndRadius - labelStartRadius - labelOffset);

    ctx.clearRect(0, 0, size, size);

    const bg = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    bg.addColorStop(0, "rgba(255,255,255,0.12)");
    bg.addColorStop(0.62, "rgba(217,70,239,0.08)");
    bg.addColorStop(1, "rgba(10,10,26,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, FULL_CIRCLE);
    ctx.fill();

    // Draw segments
    participants.forEach((p, i) => {
      const startAngle = rotation + i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;
      const color = getSegmentColor(i, participants.length);
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
      ctx.strokeStyle = "rgba(10,10,26,0.78)";
      ctx.lineWidth = Math.max(2, size * 0.008);
      ctx.stroke();

      const boundaryX = cx + outerRadius * Math.cos(startAngle);
      const boundaryY = cy + outerRadius * Math.sin(startAngle);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(boundaryX, boundaryY);
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.lineWidth = Math.max(1, size * 0.004);
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
      const normalized = normalizeAngle(textAngle);
      const shouldFlip = normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2;
      ctx.rotate(textAngle + (shouldFlip ? Math.PI : 0));
      ctx.textAlign = shouldFlip ? "right" : "left";
      ctx.textBaseline = "middle";
      const fontSize = Math.max(8, Math.min(16, (r * 0.42) / Math.max(1, Math.sqrt(participants.length))));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 5;
      const label = fitTextToWidth(ctx, p.name, maxLabelWidth);
      ctx.fillText(label, shouldFlip ? -labelOffset : labelOffset, 0, maxLabelWidth);
      ctx.restore();
    });

    ctx.shadowBlur = 0;

    // Inner cutout
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, FULL_CIRCLE);
    ctx.fillStyle = "#0a0a1a";
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.85)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(16, r * 0.07), 0, FULL_CIRCLE);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius + 7, 0, FULL_CIRCLE);
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
      ctx.arc(x, y, Math.max(2, size * 0.008), 0, FULL_CIRCLE);
      ctx.fillStyle = i === lit ? "#fff7ed" : "rgba(255,255,255,0.58)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - outerRadius);
    ctx.strokeStyle = "rgba(251,191,36,0.9)";
    ctx.lineWidth = Math.max(2, size * 0.006);
    ctx.stroke();
  }, [participants, segmentAngle, size]);

  // Idle rotation
  useEffect(() => {
    if (isSpinning || isDoneRef.current) return;
    let start = 0;
    let raf = 0;
    const animate = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start;
      const idleRotation = (elapsed / 30000) * FULL_CIRCLE;
      rotationRef.current = idleRotation;
      const currentSegment = getPointerSegment(idleRotation, participants.length);
      updateActiveSegment(currentSegment);
      drawWheel(idleRotation, currentSegment);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [drawWheel, isSpinning, participants.length, updateActiveSegment]);

  // Spin animation
  useEffect(() => {
    if (!isSpinning) return;
    isDoneRef.current = false;

    // Calculate target: land on winner segment + extra full spins
    // The pointer is at top (angle = -PI/2 from canvas perspective)
    // Segment i starts at rotation + i*segAngle - PI/2
    // We want pointer (top) to be in the middle of segment winnerIndex
    const currentRot = rotationRef.current % FULL_CIRCLE;
    const targetSegmentAngle = -(winnerIndex + 0.5) * segmentAngle;
    let deltaToTarget = (targetSegmentAngle - currentRot) % FULL_CIRCLE;
    if (deltaToTarget <= 0) deltaToTarget += FULL_CIRCLE;

    const totalSpin = TOTAL_ROTATIONS * FULL_CIRCLE + deltaToTarget;
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
      const currentSegment = getPointerSegment(rotationRef.current, participants.length);
      updateActiveSegment(currentSegment);
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
        updateActiveSegment(winnerIndex);
        drawWheel(rotationRef.current, winnerIndex, true);
        playDing();
        winnerReveal();
        setTimeout(onDone, REVEAL_DELAY);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawWheel, isSpinning, onDone, participants.length, playDing, playTick, segmentAngle, tick, updateActiveSegment, winnerId, winnerIndex, winnerReveal]);

  return (
    <div className="flex flex-col items-center gap-3">
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
      <div className="min-h-10 w-full max-w-[min(100%,20rem)] overflow-hidden rounded-xl border border-amber-300/30 bg-slate-950/80 px-4 py-2 text-center shadow-lg shadow-amber-500/10">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/70">Sous la flèche</div>
        <div className="truncate text-sm font-bold text-white sm:text-base">{activeParticipant?.name ?? ""}</div>
      </div>
    </div>
  );
}
