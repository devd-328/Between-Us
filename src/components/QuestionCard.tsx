"use client";

import { motion, useMotionValue, useTransform, useSpring, easeOut } from "framer-motion";
import { useState } from "react";

interface Question {
  id: string;
  text: string;
  category: string;
  displayCategory?: string;
  intensity: number;
}

interface QuestionCardProps {
  question: Question;
  cardNumber: number;
  total: number;
}

// Front face: 0 (visible) → 180 (hidden, rotated away)
// Back face: -180 (hidden, pre-rotated opposite) → 0 (visible)
// Using separate variant maps avoids Framer Motion style/animate conflicts.
const frontVariants = {
  visible: { rotateY: 0,   transition: { duration: 0.6, ease: easeOut } },
  hidden:  { rotateY: 180, transition: { duration: 0.6, ease: easeOut } },
};
const backVariants = {
  hidden:  { rotateY: -180, transition: { duration: 0.6, ease: easeOut } },
  visible: { rotateY: 0,    transition: { duration: 0.6, ease: easeOut } },
};

export default function QuestionCard({ question, cardNumber, total }: QuestionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const label = question.displayCategory ?? (question.category ? question.category.toUpperCase() : "UNKNOWN");

  // ── Mouse tilt lives on its own wrapper, never touching rotateY ──
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 30 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isFlipped) return; // no tilt while showing question
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      className="relative w-full aspect-[1/1.35] max-h-[55vh]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tilt wrapper (desktop hover) — only controls rotateX/Y tilt, never the flip */}
      <motion.div
        className="relative w-full h-full cursor-pointer select-none"
        style={{
          rotateX: isFlipped ? 0 : tiltX,
          rotateY: isFlipped ? 0 : tiltY,
          perspective: 1400,
          transformStyle: "preserve-3d",
        }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        {/* ── FRONT FACE — branded card back ── */}
        <motion.div
          className="absolute inset-0 rounded-[22px] flex flex-col items-center justify-center gap-6 bg-card-bg/80 backdrop-blur-xl border border-card-border overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
          animate={isFlipped ? "hidden" : "visible"}
          variants={frontVariants}
        >
          {/* Crosshatch texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--color-accent-alt) 0, var(--color-accent-alt) 1px, transparent 0, transparent 50%), " +
                "repeating-linear-gradient(-45deg, var(--color-accent-alt) 0, var(--color-accent-alt) 1px, transparent 0, transparent 50%)",
              backgroundSize: "14px 14px",
            }}
          />
          {/* Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(123,107,191,0.18)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(197,184,232,0.10)_0%,transparent_60%)] pointer-events-none" />

          <div className="font-serif text-3xl font-light tracking-[0.22em] uppercase text-accent relative z-10">
            Between Us
          </div>
          <div className="relative z-10 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-[5px] h-[5px] rounded-full bg-accent-alt opacity-60" />
            ))}
          </div>
          <div className="text-[0.72rem] tracking-[0.22em] uppercase text-text-dim relative z-10 animate-pulse">
            Tap to reveal
          </div>
        </motion.div>

        {/* ── BACK FACE — question ── */}
        <motion.div
          className="absolute inset-0 rounded-[22px] flex flex-col p-8 border border-card-border bg-card-bg/90 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
          initial={false}
          animate={isFlipped ? "visible" : "hidden"}
          variants={backVariants}
        >
          {/* Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,111,168,0.12)_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[radial-gradient(ellipse_at_bottom,rgba(155,111,168,0.20)_0%,transparent_70%)] pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center mb-auto relative z-10">
            <span className="font-sans text-[0.8rem] tracking-[0.22em] uppercase text-accent-alt">{label}</span>
            <span className="font-sans text-[0.75rem] tracking-[0.14em] text-text-dim">
              {String(cardNumber).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          {/* Question text */}
          <div className="flex-1 flex items-center relative z-10">
            <p className="font-serif text-[1.8rem] font-light leading-normal text-text-main">
              {question.text}
            </p>
          </div>

          {/* Intensity */}
          <div className="flex items-center gap-2 mt-auto relative z-10">
            <div className="flex-1 h-px bg-card-border" />
            <div className="flex gap-1 px-2">
              {Array.from({ length: question.intensity || 1 }).map((_, i) => (
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
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[55%] h-[40px] blur-[18px] rounded-full bg-accent-alt opacity-30 pointer-events-none" />
    </div>
  );
}
