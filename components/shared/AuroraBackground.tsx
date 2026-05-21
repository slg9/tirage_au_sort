"use client";
import { motion } from "framer-motion";

const blobs = [
  { color: "#a21caf", x: "10%", y: "20%", size: 600, duration: 25 },
  { color: "#4338ca", x: "60%", y: "50%", size: 500, duration: 30 },
  { color: "#d97706", x: "30%", y: "70%", size: 400, duration: 20 },
];

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: blob.color,
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            filter: "blur(120px)",
            opacity: 0.25,
          }}
          animate={{
            x: [0, 60, -40, 30, 0],
            y: [0, -40, 60, -20, 0],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <Particles />
    </div>
  );
}

function Particles() {
  const particles = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 12,
    size: 2 + Math.random() * 3,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-400/40"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
