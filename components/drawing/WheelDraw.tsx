"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
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

const TOTAL_ROTATIONS = 6;
const SPIN_DURATION = 4000;

export function WheelDraw({ participants, winnerId, isSpinning, onDone, size = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const animStartRef = useRef(0);
  const rafRef = useRef(0);
  const lastTickSegmentRef = useRef(-1);
  const { playTick, playDing } = useSounds();
  const { tick, winnerReveal } = useHaptics();
  const [isDone, setIsDone] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const segmentAngle = (2 * Math.PI) / participants.length;

  const winnerIndex = useMemo(() => {
    if (!winnerId) return 0;
    return Math.max(0, participants.findIndex((p) => p.id === winnerId));
  }, [participants, winnerId]);

  // Draw wheel on canvas
  const drawWheel = (rotation: number, lit: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = size / 2;
    const cx = r, cy = r;

    ctx.clearRect(0, 0, size, size);

    // Draw segments
    participants.forEach((p, i) => {
      const startAngle = rotation + i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 4, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = i === lit ? color + "ff" : color + "cc";
      if (i === lit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      const textAngle = startAngle + segmentAngle / 2;
      const textR = r * 0.62;
      const tx = cx + textR * Math.cos(textAngle);
      const ty = cy + textR * Math.sin(textAngle);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.max(9, Math.min(15, (r * 0.38) / Math.max(1, Math.sqrt(participants.length))));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      const maxLen = Math.max(6, Math.floor(18 / Math.sqrt(participants.length)));
      const label = p.name.length > maxLen ? p.name.slice(0, maxLen - 1) + "…" : p.name;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.12, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e1b4b";
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Idle rotation
  useEffect(() => {
    if (isSpinning || isDone) return;
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
  }, [isSpinning, isDone, participants.length]);

  // Spin animation
  useEffect(() => {
    if (!isSpinning) return;
    setIsDone(false);

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

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (timestamp: number) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const easedProgress = easeOut(progress);

      const startRot = targetRotationRef.current - totalSpin;
      rotationRef.current = startRot + totalSpin * easedProgress;

      // Detect segment changes for tick sound
      const currentSegment = Math.floor(((2 * Math.PI - ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)) * participants.length) % participants.length;
      setHighlightedIndex(currentSegment);

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
        setIsDone(true);
        drawWheel(rotationRef.current, winnerIndex);
        playDing();
        winnerReveal();
        setTimeout(onDone, 800);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isSpinning]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="rounded-full" />

      {/* Pointer */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1"
        style={{ zIndex: 10 }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "24px solid #f59e0b",
            filter: "drop-shadow(0 2px 8px rgba(245,158,11,0.8))",
          }}
        />
      </div>
    </div>
  );
}
