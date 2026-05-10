"use client";

import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface Question {
  id: string;
  text: string;
  category: string;
  displayCategory?: string;
  intensity: number;
}

interface FlipCardProps {
  question: Question | null;
  isFlipped: boolean;
  onFlip: () => void;
  activePlayer: 1 | 2;
  cardNumber: number;
  disabled?: boolean;
}

// Two separate variant maps — the only correct pattern to avoid
// Framer Motion style/animate conflicts on rotateY.
const EASE = [0.35, 0.15, 0.15, 1] as [number, number, number, number];

const frontVariants = {
  visible: { rotateY: 0,   transition: { duration: 0.7, ease: EASE } },
  hidden:  { rotateY: 180, transition: { duration: 0.7, ease: EASE } },
};
const backVariants = {
  hidden:  { rotateY: -180, transition: { duration: 0.7, ease: EASE } },
  visible: { rotateY: 0,    transition: { duration: 0.7, ease: EASE } },
};

const BACKFACE: React.CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

export default function FlipCard({
  question,
  isFlipped,
  onFlip,
  activePlayer,
  cardNumber,
  disabled = false,
}: FlipCardProps) {
  const isP1 = activePlayer === 1;
  const label = question?.displayCategory ?? (question?.category ? String(question.category).toUpperCase() : "");

  // ── Mouse tilt — lives on its OWN wrapper, never touches rotateY ──
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 30 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-8,  8]), { stiffness: 120, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isFlipped) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }
  function handleMouseLeave() { mx.set(0); my.set(0); }

  return (
    <div
      className="relative w-full max-w-[360px] aspect-[1/1.4] max-h-[52vh] mb-7"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tilt wrapper — only controls X/Y tilt, NEVER the flip rotateY */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: isFlipped ? 0 : tiltX,
          rotateY: isFlipped ? 0 : tiltY,
          perspective: "1400px",
          transformStyle: "preserve-3d",
          cursor: disabled ? "default" : "pointer",
        }}
        onClick={() => !disabled && onFlip()}
      >
        {/* ── FRONT FACE — branded card back ── */}
        <motion.div
          className="absolute inset-0 rounded-[22px] flex flex-col items-center justify-center gap-7 bg-card-bg/80 backdrop-blur-xl border border-card-border overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          style={{ ...BACKFACE, transformStyle: "preserve-3d" }}
          animate={isFlipped ? "hidden" : "visible"}
          variants={frontVariants}
        >
          {/* Crosshatch texture */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,var(--color-accent-alt) 0,var(--color-accent-alt) 1px,transparent 0,transparent 50%)," +
                "repeating-linear-gradient(-45deg,var(--color-accent-alt) 0,var(--color-accent-alt) 1px,transparent 0,transparent 50%)",
              backgroundSize: "14px 14px",
            }}
          />
          {/* Top glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,107,191,0.18)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(197,184,232,0.10)_0%,transparent_60%)] pointer-events-none" />

          <div className="font-serif text-3xl font-light tracking-[0.22em] uppercase text-accent relative z-10">
            Between Us
          </div>
          <div className="relative z-10 flex items-center gap-3">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-[5px] h-[5px] rounded-full bg-accent-alt opacity-60" />
            ))}
          </div>
          <div className="text-[0.8rem] tracking-[0.2em] uppercase text-text-dim relative z-10 animate-pulse">
            Tap to reveal
          </div>
        </motion.div>

        {/* ── BACK FACE — question content ── */}
        <motion.div
          className="absolute inset-0 rounded-[22px] flex flex-col p-8 border border-card-border overflow-hidden bg-card-bg/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          style={{ ...BACKFACE, transformStyle: "preserve-3d" }}
          initial={false}
          animate={isFlipped ? "visible" : "hidden"}
          variants={backVariants}
        >
          {/* Player colour ribbon */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-[60%] rounded-b-[6px] transition-colors duration-350 ${isP1 ? "bg-p1" : "bg-p2"}`}
          />

          {/* Player-tinted glow */}
          <div
            className={`absolute inset-0 rounded-[22px] pointer-events-none ${
              isP1
                ? "bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.09)_0%,transparent_70%)]"
                : "bg-[radial-gradient(ellipse_at_top,rgba(155,111,168,0.09)_0%,transparent_70%)]"
            }`}
          />

          {/* Header */}
          <div className="flex justify-between items-center mt-2 mb-auto relative z-10">
            <span className="font-sans text-[0.85rem] tracking-[0.22em] uppercase font-medium text-accent">
              {label}
            </span>
            <span className="font-sans text-[0.75rem] tracking-[0.14em] text-text-dim">
              {String(cardNumber).padStart(2, "0")}
            </span>
          </div>

          {/* Question text */}
          <div className="font-serif text-[1.75rem] font-light leading-[1.4] text-text-main flex-1 flex items-center py-6 relative z-10">
            {question?.text ?? "…"}
          </div>

          {/* Intensity */}
          <div className="flex items-center gap-2 mt-auto relative z-10 w-full">
            <div className="flex-1 h-px bg-card-border" />
            <div className="flex gap-1 px-2">
              {Array.from({ length: question?.intensity ?? 1 }).map((_, i) => (
                <span key={i} className="text-[0.7rem] opacity-80">🌶️</span>
              ))}
            </div>
            <div className="flex-1 h-px bg-card-border" />
          </div>

          <div className="text-center text-[0.6rem] tracking-[0.18em] uppercase text-text-dim mt-3 opacity-40 relative z-10">
            tap to flip back
          </div>
        </motion.div>
      </motion.div>

      {/* Drop shadow */}
      <div
        className={`absolute bottom-[-24px] left-1/2 -translate-x-1/2 w-[60%] h-[48px] blur-[20px] rounded-full pointer-events-none opacity-50 transition-colors duration-350 ${
          isP1 ? "bg-p1" : "bg-p2"
        }`}
      />
    </div>
  );
}
