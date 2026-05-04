"use client";

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

export default function QuestionCard({ question, cardNumber, total }: QuestionCardProps) {
  const label = question.displayCategory ?? (question.category ? question.category.toUpperCase() : "UNKNOWN");

  return (
    <div className="relative w-full aspect-[1/1.35] max-h-[55vh]">
      {/* Card */}
      <div className="relative w-full h-full rounded-[22px] border border-card-border bg-card-bg overflow-hidden flex flex-col p-8">
        {/* Top glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,111,168,0.10)_0%,transparent_65%)] pointer-events-none" />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[radial-gradient(ellipse_at_bottom,rgba(155,111,168,0.18)_0%,transparent_70%)] pointer-events-none" />

        {/* Header row */}
        <div className="flex justify-between items-center mb-auto relative z-10">
          <span className="font-sans text-[0.6rem] tracking-[0.22em] uppercase text-accent-alt">
            {label}
          </span>
          <span className="font-sans text-[0.58rem] tracking-[0.14em] text-text-dim">
            {String(cardNumber).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center relative z-10">
          <p className="font-serif text-[1.45rem] font-light leading-normal text-text-main">
            {question.text}
          </p>
        </div>

        {/* Bottom dot indicator */}
        <div className="flex items-center gap-2 mt-auto relative z-10">
          <div className="flex-1 h-px bg-card-border" />
          <div className="w-[5px] h-[5px] rounded-full bg-accent-alt" />
          <div className="flex-1 h-px bg-card-border" />
        </div>
      </div>

      {/* Drop shadow */}
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[55%] h-[40px] blur-[18px] rounded-full bg-accent-alt opacity-30 pointer-events-none" />
    </div>
  );
}
