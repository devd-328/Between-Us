"use client";

import { useState, useEffect } from "react";
import FlipCard from "@/components/FlipCard";
import QuestionCard from "@/components/QuestionCard";
import { Question } from "@/lib/questions";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, Share2, Loader2, Bookmark, BookmarkCheck, Layers, Users } from "lucide-react";

// Map raw DB category → display label
const CAT_MAP: Record<string, string> = {
  icebreakers: "FUN",
  funny: "FUN",
  deep: "DEEP",
  relationship: "US",
  hypothetical: "WHAT IF",
  "late-night": "LATE NIGHT",
};

const FILTERS = ["ALL", "DEEP", "FUN", "US", "WHAT IF", "LATE NIGHT"];

type Mode = "splash" | "browse" | "game";

export default function Home() {
  const [all, setAll] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("splash");

  // Browse state
  const [filter, setFilter] = useState("ALL");
  const [browseIdx, setBrowseIdx] = useState(0);
  const [saved, setSaved] = useState<Question[]>([]);

  // Game state
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [histPos, setHistPos] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [player, setPlayer] = useState<1 | 2>(1);
  const [inviteText, setInviteText] = useState("Invite");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "questions"));
        const qs: Question[] = [];
        snap.forEach(d => {
          const data = d.data();
          const cat: string = data.category ?? "other";
          qs.push({ id: d.id, text: data.text ?? "", category: cat, intensity: data.intensity ?? 1, displayCategory: CAT_MAP[cat] ?? (cat ? String(cat).toUpperCase() : "UNKNOWN") });
        });
        const shuffled = qs.sort(() => Math.random() - 0.5);
        setAll(shuffled);
        setHistory([Math.floor(Math.random() * shuffled.length)]);
        setHistPos(0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived
  const filtered = filter === "ALL" ? all : all.filter(q => (q.displayCategory ?? "") === filter);
  const browseQ = filtered[browseIdx] ?? null;
  const gameQ = histPos >= 0 && history.length ? all[history[histPos]] ?? null : null;
  const isSavedBrowse = browseQ ? saved.some(s => s.id === browseQ.id) : false;
  const isSavedGame = gameQ ? saved.some(s => s.id === gameQ.id) : false;

  const toggleSave = (q: Question) =>
    setSaved(prev => prev.some(s => s.id === q.id) ? prev.filter(s => s.id !== q.id) : [...prev, q]);

  const nextGame = () => {
    setFlipped(false);
    setTimeout(() => {
      const avail = all.map((_, i) => i).filter(i => !history.includes(i));
      const next = avail.length ? avail[Math.floor(Math.random() * avail.length)] : Math.floor(Math.random() * all.length);
      const newH = [...history.slice(0, histPos + 1), next];
      setHistory(newH); setHistPos(newH.length - 1);
      setPlayer(p => p === 1 ? 2 : 1);
    }, 400);
  };

  const prevGame = () => {
    if (histPos > 0) { setFlipped(false); setTimeout(() => { setHistPos(h => h - 1); setPlayer(p => p === 1 ? 2 : 1); }, 400); }
  };

  const invite = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
    setInviteText("Copied!"); setTimeout(() => setInviteText("Invite"), 2000);
  };

  const p1Label = p1.trim() || "Player 1";
  const p2Label = p2.trim() || "Player 2";

  // ── SPLASH ──────────────────────────────────────────────────────
  if (mode === "splash") return (
    <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
      <div className="w-full max-w-[400px] text-center">
        <h1 className="font-serif text-[2.6rem] font-light tracking-[0.28em] uppercase text-accent leading-none">Between Us</h1>
        <div className="text-[0.62rem] tracking-[0.26em] uppercase text-text-dim mt-3">Questions for the ones who matter</div>
        <div className="w-[40px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto my-8" />

        <div className="flex flex-col gap-4 mb-8">
          {/* Browse */}
          <button onClick={() => { setMode("browse"); setBrowseIdx(0); }} disabled={loading}
            className="group relative w-full bg-bg-panel border border-card-border rounded-2xl p-5 text-left transition-all duration-300 hover:border-accent-alt hover:shadow-[0_0_24px_rgba(155,111,168,0.2)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-[rgba(155,111,168,0.07)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[rgba(155,111,168,0.15)] flex items-center justify-center shrink-0">
                <Layers size={18} className="text-accent-alt" />
              </div>
              <div>
                <div className="font-sans text-[0.78rem] tracking-[0.14em] uppercase text-text-main font-medium mb-1">Browse Mode</div>
                <div className="font-serif text-sm text-text-muted leading-relaxed">Explore questions by category at your own pace</div>
              </div>
            </div>
          </button>

          {/* Game */}
          <button onClick={() => setMode("game")} disabled={loading}
            className="group relative w-full bg-bg-panel border border-card-border rounded-2xl p-5 text-left transition-all duration-300 hover:border-accent hover:shadow-[0_0_24px_rgba(201,169,110,0.2)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-[rgba(201,169,110,0.07)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,169,110,0.15)] flex items-center justify-center shrink-0">
                <Users size={18} className="text-accent" />
              </div>
              <div>
                <div className="font-sans text-[0.78rem] tracking-[0.14em] uppercase text-text-main font-medium mb-1">Game Mode</div>
                <div className="font-serif text-sm text-text-muted leading-relaxed">Take turns with someone you care about</div>
              </div>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-text-dim text-[0.62rem] tracking-widest uppercase font-sans">
            <Loader2 size={12} className="animate-spin" /><span>Preparing deck…</span>
          </div>
        )}
        {error && <div className="text-rose text-[0.62rem] tracking-widest uppercase font-sans">{error}</div>}
      </div>
    </main>
  );

  // ── BROWSE ──────────────────────────────────────────────────────
  if (mode === "browse") return (
    <main className="flex flex-col items-center min-h-screen relative z-10 w-full max-w-[420px] mx-auto px-5 pt-10 pb-24">
      {/* Header */}
      <div className="w-full text-center mb-6 relative">
        <button onClick={() => setMode("splash")} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-serif text-[1.85rem] font-light tracking-[0.26em] uppercase text-accent">Between Us</h1>
        <div className="text-[0.6rem] tracking-[0.24em] uppercase text-text-dim mt-1">Questions for the ones who matter</div>
        <div className="w-[30px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mt-3" />
      </div>

      {/* Filter pills */}
      <div className="w-full flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map(tab => (
          <button key={tab} onClick={() => { setFilter(tab); setBrowseIdx(0); }}
            className={`shrink-0 font-sans text-[0.6rem] tracking-[0.14em] uppercase rounded-full border px-4 py-2 transition-all duration-200 ${
              filter === tab
                ? "border-accent text-accent bg-[rgba(201,169,110,0.1)] shadow-[0_0_12px_rgba(201,169,110,0.18)]"
                : "border-card-border text-text-dim hover:border-text-dim hover:text-text-muted"
            }`}>{tab}</button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-7 h-7 text-accent animate-spin" />
          <p className="text-text-dim text-[0.68rem] tracking-widest uppercase font-sans">Loading deck…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-dim text-sm tracking-widest uppercase font-sans">No questions here.</p>
        </div>
      )}

      {!loading && browseQ && (
        <>
          <QuestionCard question={browseQ} cardNumber={browseIdx + 1} total={filtered.length} />

          {/* Actions */}
          <div className="flex gap-3 mt-6 w-full">
            <button onClick={() => toggleSave(browseQ)}
              className={`flex items-center gap-2 font-sans text-[0.65rem] tracking-[0.14em] uppercase border rounded-full px-5 py-3 transition-all duration-200 ${
                isSavedBrowse ? "border-rose text-rose bg-[rgba(196,116,138,0.08)]" : "border-card-border text-text-muted hover:border-text-muted hover:text-text-main"
              }`}>
              {isSavedBrowse ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              Save {isSavedBrowse ? "✓" : "♦"}
            </button>
            <button onClick={() => setBrowseIdx(i => (i + 1) % filtered.length)}
              className="flex-1 flex items-center justify-center gap-2 font-sans text-[0.65rem] tracking-[0.14em] uppercase border border-accent rounded-full px-5 py-3 text-accent transition-all duration-200 hover:bg-accent hover:text-bg-base shadow-[0_0_18px_rgba(201,169,110,0.2)]">
              Next Card →
            </button>
          </div>

          {/* Progress */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between text-[0.58rem] tracking-[0.16em] uppercase text-text-dim mb-2">
              <span>Explored</span>
              <span>{browseIdx + 1} of {filtered.length}</span>
            </div>
            <div className="w-full h-[2px] bg-card-border rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-accent-alt to-accent rounded-full transition-all duration-500"
                style={{ width: `${((browseIdx + 1) / filtered.length) * 100}%` }} />
            </div>
          </div>

          {/* Saved list */}
          {saved.length > 0 && (
            <div className="w-full mt-10">
              <div className="text-[0.58rem] tracking-[0.2em] uppercase text-text-dim mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-card-border">
                Saved
              </div>
              <div className="flex flex-col gap-2">
                {saved.map(q => (
                  <div key={q.id} className="bg-bg-panel border border-card-border rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-alt shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <p className="font-serif text-sm font-light leading-normal text-text-main">{q.text}</p>
                      <span className="text-[0.54rem] tracking-[0.14em] uppercase text-accent">{q.displayCategory}</span>
                    </div>
                    <button onClick={() => setSaved(prev => prev.filter(s => s.id !== q.id))} className="text-text-dim hover:text-rose transition-colors p-1 -mt-0.5">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );

  // ── GAME MODE ───────────────────────────────────────────────────
  if (mode === "game") {
    // Player name entry
    if (!gameStarted) return (
      <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
        <div className="w-full max-w-[400px] text-center">
          <button onClick={() => setMode("splash")} className="absolute top-8 left-5 text-text-dim hover:text-text-muted transition-colors p-1">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif text-[2rem] font-light tracking-[0.2em] uppercase text-accent mb-1">Between Us</h1>
          <div className="text-[0.62rem] tracking-[0.24em] uppercase text-text-dim mb-8">Game Mode</div>
          <div className="w-[40px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mb-8" />
          <div className="text-[0.68rem] tracking-[0.18em] uppercase text-text-muted mb-5">Who is playing?</div>
          <div className="flex flex-col gap-3 mb-8">
            {[{ val: p1, set: setP1, color: "bg-p1", ph: "Player 1" }, { val: p2, set: setP2, color: "bg-p2", ph: "Player 2" }].map(({ val, set, color, ph }) => (
              <div key={ph} className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${color}`} />
                <input type="text" placeholder={ph} value={val} onChange={e => set(e.target.value)}
                  className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" />
              </div>
            ))}
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-text-dim text-[0.62rem] tracking-widest uppercase font-sans mb-4">
              <Loader2 size={12} className="animate-spin" /><span>Preparing deck…</span>
            </div>
          )}
          <button onClick={() => setGameStarted(true)} disabled={loading}
            className="w-full bg-transparent border border-accent rounded-full py-3.5 px-6 text-accent font-sans text-[0.7rem] tracking-[0.2em] uppercase cursor-pointer transition-all duration-300 relative overflow-hidden group hover:text-bg-base disabled:opacity-40 disabled:cursor-not-allowed">
            <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{loading ? "Loading Deck…" : "Begin Journey"}</span>
          </button>
        </div>
      </main>
    );

    // Game screen
    return (
      <main className="relative z-10 w-full max-w-[520px] px-6 py-10 pb-20 flex flex-col items-center min-h-screen mx-auto">
        <header className="w-full text-center mb-8 relative">
          <button onClick={() => setGameStarted(false)} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif text-[1.7rem] font-light tracking-[0.2em] uppercase text-accent">Between Us</h1>
          <div className="w-[30px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mt-2" />
        </header>

        {/* Turn indicator */}
        <div className="w-full max-w-[380px] flex gap-2 mb-8 bg-bg-panel border border-card-border rounded-full p-1.5">
          {([1, 2] as const).map(p => (
            <div key={p} onClick={() => setPlayer(p)}
              className={`flex-1 text-center py-2 px-3 rounded-full text-[0.68rem] tracking-widest uppercase transition-all duration-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap ${
                player === p
                  ? p === 1 ? "bg-[rgba(201,169,110,0.15)] text-p1 border border-[rgba(201,169,110,0.3)]" : "bg-[rgba(155,111,168,0.15)] text-p2 border border-[rgba(155,111,168,0.3)]"
                  : "text-text-dim border border-transparent"
              }`}>
              {p === 1 ? p1Label : p2Label}
            </div>
          ))}
        </div>

        {gameQ
          ? <FlipCard question={gameQ} isFlipped={flipped} onFlip={() => setFlipped(true)} activePlayer={player} cardNumber={histPos + 1} />
          : <div className="text-text-dim text-sm tracking-widest uppercase font-sans flex-1 flex items-center">No questions available.</div>
        }

        <div className="flex gap-2.5 flex-wrap justify-center mt-6 w-full max-w-[360px]">
          <button onClick={prevGame} disabled={histPos <= 0}
            className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-card-border rounded-full px-5 py-2.5 text-text-muted transition-all hover:text-text-main hover:border-text-muted disabled:opacity-40 flex items-center gap-2">
            <ArrowLeft size={13} /> Back
          </button>
          <button onClick={() => gameQ && toggleSave(gameQ)}
            className={`font-sans text-[0.68rem] tracking-[0.14em] uppercase border rounded-full px-5 py-2.5 transition-all flex items-center gap-2 ${
              isSavedGame ? "border-rose text-rose" : "border-card-border text-text-muted hover:border-text-muted hover:text-text-main"
            }`}>
            {isSavedGame ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} Save
          </button>
          <button onClick={nextGame}
            className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-accent rounded-full px-5 py-2.5 text-accent transition-all hover:bg-accent hover:text-bg-base shadow-[0_0_20px_rgba(201,169,110,0.25)] flex-1 min-w-[110px]">
            Next Card
          </button>
          <button onClick={invite}
            className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-accent-alt rounded-full px-5 py-2.5 text-accent-alt transition-all hover:bg-accent-alt hover:text-white flex items-center gap-2">
            <Share2 size={13} /> {inviteText}
          </button>
        </div>

        <div className="w-full max-w-[360px] mt-8">
          <div className="flex justify-between text-[0.58rem] tracking-[0.14em] text-text-dim uppercase mb-2">
            <span>Journey</span><span>{histPos + 1} / {all.length}</span>
          </div>
          <div className="w-full h-[2px] bg-card-border rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-accent-alt to-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((histPos + 1) / all.length) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="w-full max-w-[360px] flex gap-2 mt-5">
          {[{ label: p1Label, val: Math.ceil((histPos + 1) / 2), cls: "text-p1" }, { label: "Total", val: histPos + 1, cls: "text-text-main" }, { label: p2Label, val: Math.floor((histPos + 1) / 2), cls: "text-p2" }].map(({ label, val, cls }) => (
            <div key={label} className="flex-1 bg-bg-panel border border-card-border rounded-xl p-3 text-center">
              <div className={`text-[0.56rem] tracking-[0.12em] uppercase mb-1 overflow-hidden text-ellipsis whitespace-nowrap ${cls}`}>{label}</div>
              <div className={`font-serif text-[1.5rem] font-light ${cls}`}>{val}</div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return null;
}
