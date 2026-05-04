"use client";

import { motion } from "framer-motion";

interface Question {
  id: string;
  text: string;
  category: string;
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

export default function FlipCard({
  question,
  isFlipped,
  onFlip,
  activePlayer,
  cardNumber,
  disabled = false,
}: FlipCardProps) {
  const isP1 = activePlayer === 1;

  return (
    <div className="relative w-full max-w-[360px] aspect-[1/1.4] max-h-[52vh] mb-7 perspective-[1400px]">
      <motion.div
        className={`relative w-full h-full transform-3d ${disabled ? "cursor-default" : "cursor-pointer"}`}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.75, ease: [0.35, 0.15, 0.15, 1] }}
        onClick={() => !disabled && onFlip()}
      >
        {/* Back of card */}
        <div
          className="absolute inset-0 rounded-[22px] backface-hidden flex flex-col items-center justify-center gap-7 bg-card-bg border border-card-border overflow-hidden"
          style={{ WebkitBackfaceVisibility: "hidden" }}
        >
          <div
            className="absolute inset-0 opacity/6 bg-[repeating-linear-gradient(45deg,var(--color-accent-alt)_0,var(--color-accent-alt)_1px,transparent_0,transparent_50%),repeating-linear-gradient(-45deg,var(--color-accent-alt)_0,var(--color-accent-alt)_1px,transparent_0,transparent_50%)]"
            style={{ backgroundSize: "14px 14px" }}
          ></div>
          <div className="font-serif text-xl font-light tracking-[0.22em] uppercase text-accent relative z-10">
            Between Us
          </div>
          <div className="relative z-10 flex items-center gap-3 text-text-dim text-[0.65rem] tracking-[0.14em]">
            <span className="w-1 h-1 rounded-full bg-accent-alt"></span>
            <span className="w-1 h-1 rounded-full bg-accent-alt"></span>
            <span className="w-1 h-1 rounded-full bg-accent-alt"></span>
          </div>
          <div className="text-[0.62rem] tracking-[0.2em] uppercase text-text-dim relative z-10 animate-pulse">
            Tap to reveal
          </div>
        </div>

        {/* Front of card */}
        <div
          className="absolute inset-0 rounded-[22px] backface-hidden flex flex-col p-[2.2rem_2rem] border border-card-border overflow-hidden bg-card-bg"
          style={{
            transform: "rotateY(180deg)",
            WebkitBackfaceVisibility: "hidden",
            WebkitTransform: "rotateY(180deg)",
          }}
        >
          {/* Glow effect based on player */}
          <div
            className={`absolute inset-0 rounded-[22px] opacity-100 transition-opacity duration-600 pointer-events-none ${
              isP1
                ? "bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.08)_0%,transparent_70%)]"
                : "bg-[radial-gradient(ellipse_at_top,rgba(155,111,168,0.08)_0%,transparent_70%)]"
            }`}
          ></div>

          {/* Player Ribbon */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-[60%] rounded-b-[6px] transition-colors duration-350 ${
              isP1 ? "bg-p1" : "bg-p2"
            }`}
          ></div>

          <div className="flex justify-between items-start mt-2 mb-auto z-10">
            <span className="text-[0.62rem] tracking-[0.22em] uppercase font-medium text-accent">
              {question?.category || "Loading"}
            </span>
            <span className="text-[0.58rem] tracking-[0.14em] text-text-dim">
              {cardNumber.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="font-serif text-2xl font-light leading-[1.4] text-text-main flex-1 flex items-center py-8 z-10">
            {question?.text || "..."}
          </div>

          <div className="flex items-center gap-2 mt-auto z-10 w-full">
            <div className="flex-1 h-px bg-card-border"></div>
            
            {/* Intensity Meter */}
            <div className="flex gap-1 items-center px-2">
              {Array.from({ length: question?.intensity || 1 }).map((_, i) => (
                <span key={i} className="text-[0.7rem] opacity-80" title={`Intensity: ${question?.intensity}`}>🌶️</span>
              ))}
            </div>

            <div className="flex-1 h-px bg-card-border"></div>
          </div>
        </div>
      </motion.div>

      {/* Card Shadow */}
      <div
        className={`absolute bottom-[-25px] left-1/2 -translate-x-1/2 w-[60%] h-[50px] blur-[18px] rounded-full pointer-events-none opacity-50 transition-colors duration-350 ${
          isP1 ? "bg-p1" : "bg-p2"
        }`}
      ></div>
    </div>
  );
}
