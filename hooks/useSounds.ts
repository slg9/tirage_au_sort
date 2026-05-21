"use client";
import { useCallback, useRef } from "react";
import { useStore } from "@/lib/store";

export function useSounds() {
  const isMuted = useStore((s) => s.isMuted);
  const toneRef = useRef<typeof import("tone") | null>(null);

  const getTone = useCallback(async () => {
    if (!toneRef.current) {
      toneRef.current = await import("tone");
    }
    return toneRef.current;
  }, []);

  const playTick = useCallback(
    async (speed: number = 1) => {
      if (isMuted) return;
      try {
        const Tone = await getTone();
        await Tone.start();
        const synth = new Tone.MembraneSynth({
          pitchDecay: 0.01,
          octaves: 2,
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 },
        }).toDestination();
        synth.volume.value = Math.min(-10, -20 + speed * 5);
        const pitch = 200 + (Math.random() - 0.5) * 50;
        synth.triggerAttackRelease(pitch, "16n");
        setTimeout(() => synth.dispose(), 300);
      } catch {}
    },
    [isMuted, getTone]
  );

  const playDing = useCallback(async () => {
    if (isMuted) return;
    try {
      const Tone = await getTone();
      await Tone.start();
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.4 }).toDestination();
      const synth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(reverb);
      synth.triggerAttackRelease("A5", "8n");
      setTimeout(() => { synth.dispose(); reverb.dispose(); }, 1000);
    } catch {}
  }, [isMuted, getTone]);

  const playWoosh = useCallback(async () => {
    if (isMuted) return;
    try {
      const Tone = await getTone();
      await Tone.start();
      const filter = new Tone.Filter(2000, "lowpass").toDestination();
      const synth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.1 },
      }).connect(filter);
      synth.triggerAttackRelease("4n");
      setTimeout(() => { synth.dispose(); filter.dispose(); }, 600);
    } catch {}
  }, [isMuted, getTone]);

  const playFanfare = useCallback(async () => {
    if (isMuted) return;
    try {
      const Tone = await getTone();
      await Tone.start();
      const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.5 }).toDestination();
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).connect(reverb);
      const notes = ["C4", "E4", "G4", "C5"];
      notes.forEach((note, i) => {
        setTimeout(() => synth.triggerAttackRelease(note, "8n"), i * 150);
      });
      setTimeout(() => { synth.dispose(); reverb.dispose(); }, 2000);
    } catch {}
  }, [isMuted, getTone]);

  const playSubBass = useCallback(async () => {
    if (isMuted) return;
    try {
      const Tone = await getTone();
      await Tone.start();
      const synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.05 },
      }).toDestination();
      synth.volume.value = -6;
      synth.triggerAttackRelease(50, "8n");
      setTimeout(() => synth.dispose(), 400);
    } catch {}
  }, [isMuted, getTone]);

  return { playTick, playDing, playWoosh, playFanfare, playSubBass };
}
