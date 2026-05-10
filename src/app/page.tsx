"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FlipCard from "@/components/FlipCard";
import QuestionCard from "@/components/QuestionCard";
import LottieBackground from "@/components/LottieBackground";
import ChatOverlay from "@/components/ChatOverlay";
import { useChat } from "@/hooks/useChat";
import { Question } from "@/lib/questions";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { ArrowLeft, Share2, Loader2, Bookmark, BookmarkCheck, Layers, Users, Flame, Globe2, SkipForward, MessageCircle } from "lucide-react";

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

const generateRoomId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export default function Home() {
  const [all, setAll] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── All persisted state starts with safe SSR defaults ──
  // sessionStorage is ONLY read inside useEffect (client-side), never in useState().
  const [mode, setMode] = useState<Mode>("splash");

  // Browse state
  const [filter, setFilter] = useState("ALL");
  const [browseIdx, setBrowseIdx] = useState(0);
  const [saved, setSaved] = useState<Question[]>([]);

  // Game state
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histPos, setHistPos] = useState(-1);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0); // only increments on Next, never on skip/prev
  const [flipped, setFlipped] = useState(false);
  const [player, setPlayer] = useState<1 | 2>(1);
  const [inviteText, setInviteText] = useState("Invite");

  // Multi-player state
  const [playMode, setPlayMode] = useState<"local" | "online">("local");
  const [intensityPref, setIntensityPref] = useState<number | "random">("random");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(true);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { messages, unreadCount } = useChat(onlineRoomId, chatOpen);

  // ── Single effect: restore from sessionStorage on first client render ──
  useEffect(() => {
    try {
      const savedMode = sessionStorage.getItem("bu_mode") as Mode | null;
      if (savedMode) setMode(savedMode);
      const savedP1 = sessionStorage.getItem("bu_p1");
      if (savedP1) setP1(savedP1);
      const savedP2 = sessionStorage.getItem("bu_p2");
      if (savedP2) setP2(savedP2);
      if (sessionStorage.getItem("bu_gameStarted") === "1") setGameStarted(true);
      const savedPlayer = Number(sessionStorage.getItem("bu_player"));
      if (savedPlayer === 1 || savedPlayer === 2) setPlayer(savedPlayer);
      const savedPlayMode = sessionStorage.getItem("bu_playMode") as "local" | "online" | null;
      if (savedPlayMode) setPlayMode(savedPlayMode);
      // Restore game progress so refresh lands on the correct question
      const savedHistory = sessionStorage.getItem("bu_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedHistPos = sessionStorage.getItem("bu_histPos");
      if (savedHistPos !== null) setHistPos(Number(savedHistPos));
      const savedAnswered = sessionStorage.getItem("bu_answered");
      if (savedAnswered !== null) setAnsweredCount(Number(savedAnswered));
    } catch { /* ignore private/incognito */ }
  }, []);

  // ── Persist key state to sessionStorage whenever it changes ──
  useEffect(() => { try { sessionStorage.setItem("bu_mode", mode); } catch {} }, [mode]);
  useEffect(() => { try { sessionStorage.setItem("bu_p1", p1); } catch {} }, [p1]);
  useEffect(() => { try { sessionStorage.setItem("bu_p2", p2); } catch {} }, [p2]);
  useEffect(() => { try { sessionStorage.setItem("bu_gameStarted", gameStarted ? "1" : "0"); } catch {} }, [gameStarted]);
  useEffect(() => { try { sessionStorage.setItem("bu_player", String(player)); } catch {} }, [player]);
  useEffect(() => { try { sessionStorage.setItem("bu_playMode", playMode); } catch {} }, [playMode]);
  useEffect(() => { try { sessionStorage.setItem("bu_history", JSON.stringify(history)); } catch {} }, [history]);
  useEffect(() => { try { sessionStorage.setItem("bu_histPos", String(histPos)); } catch {} }, [histPos]);
  useEffect(() => { try { sessionStorage.setItem("bu_answered", String(answeredCount)); } catch {} }, [answeredCount]);

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
        // Store in original order; we shuffle fresh at each game-start
        setAll(qs);

        // URL params override session (e.g. online invite link)
        const params = new URLSearchParams(window.location.search);
        const room = params.get("room");
        if (room) {
          setPlayMode("online");
          setRoomIdInput(room.toUpperCase());
          setMode("game");
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Listen to Firestore for online rooms
  useEffect(() => {
    if (!onlineRoomId) return;
    const unsub = onSnapshot(doc(db, "rooms", onlineRoomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.p2 && data.p1) setGameStarted(true); // both joined
        setP1(data.p1 || "");
        if (data.p2) setP2(data.p2);
        setHistory(data.history || []);
        setHistPos(data.histPos ?? -1);
        setFlipped(data.flipped || false);
        setPlayer(data.player || 1);
        if (data.intensityPref) setIntensityPref(data.intensityPref);
      }
    });
    return () => unsub();
  }, [onlineRoomId]);

  // Derived
  const filtered = filter === "ALL" ? all : all.filter(q => (q.displayCategory ?? "") === filter);
  const browseQ = filtered[browseIdx] ?? null;
  const gameQ = histPos >= 0 && history.length ? all.find(q => q.id === history[histPos]) ?? null : null;
  const isSavedBrowse = browseQ ? saved.some(s => s.id === browseQ.id) : false;
  const isSavedGame = gameQ ? saved.some(s => s.id === gameQ.id) : false;

  const toggleSave = (q: Question) =>
    setSaved(prev => prev.some(s => s.id === q.id) ? prev.filter(s => s.id !== q.id) : [...prev, q]);

  // Fisher-Yates shuffle — used to randomise the deck at game-start
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const getNextAvailableId = (currentHistory: string[], desiredIntensity: number | "random", currentSkipped: string[] = []) => {
    const validIds = all
      .filter(q => desiredIntensity === "random" || q.intensity === desiredIntensity)
      .map(q => q.id);
    // Prefer questions that haven't been seen OR were skipped (second chance)
    const unseen  = validIds.filter(id => !currentHistory.includes(id));
    const skippedAvail = currentSkipped.filter(id => validIds.includes(id));
    const pool = unseen.length ? unseen : (skippedAvail.length ? skippedAvail : validIds);
    return pool[Math.floor(Math.random() * pool.length)] ?? (all[0]?.id ?? "");
  };

  const nextGame = () => {
    setAnsweredCount(c => c + 1); // only place answered count increments
    updateFlipped(false);
    setTimeout(() => {
      const next = getNextAvailableId(history, intensityPref, skipped);
      const newH = [...history.slice(0, histPos + 1), next];
      const newPlayer = player === 1 ? 2 : 1;

      if (onlineRoomId) {
        updateDoc(doc(db, "rooms", onlineRoomId), {
          history: newH,
          histPos: newH.length - 1,
          player: newPlayer,
          flipped: false
        });
      } else {
        setHistory(newH);
        setHistPos(newH.length - 1);
        setPlayer(newPlayer);
      }
    }, 400);
  };

  // Skip: advance question without toggling turn; skipped question re-enters the pool
  const skipGame = () => {
    if (gameQ) setSkipped(prev => prev.includes(gameQ.id) ? prev : [...prev, gameQ.id]);
    updateFlipped(false);
    setTimeout(() => {
      const newSkipped = gameQ ? [...skipped, gameQ.id] : skipped;
      const next = getNextAvailableId(history, intensityPref, newSkipped);
      const newH = [...history.slice(0, histPos + 1), next];
      if (onlineRoomId) {
        updateDoc(doc(db, "rooms", onlineRoomId), { history: newH, histPos: newH.length - 1, flipped: false });
      } else {
        setHistory(newH);
        setHistPos(newH.length - 1);
        // player turn does NOT change on skip
      }
    }, 400);
  };

  const prevGame = () => {
    if (histPos > 0) {
      updateFlipped(false);
      setTimeout(() => {
        const newPlayer = player === 1 ? 2 : 1;
        if (onlineRoomId) {
          updateDoc(doc(db, "rooms", onlineRoomId), {
            histPos: histPos - 1,
            player: newPlayer,
            flipped: false
          });
        } else {
          setHistPos(h => h - 1);
          setPlayer(newPlayer);
        }
      }, 400);
    }
  };

  const updateFlipped = (state: boolean) => {
    if (onlineRoomId) {
      updateDoc(doc(db, "rooms", onlineRoomId), { flipped: state });
    } else {
      setFlipped(state);
    }
  };

  const updatePlayerTurn = (p: 1 | 2) => {
    if (onlineRoomId) {
      updateDoc(doc(db, "rooms", onlineRoomId), { player: p });
    } else {
      setPlayer(p);
    }
  }

  const invite = async () => {
    try {
      const url = new URL(window.location.href);
      if (onlineRoomId) url.searchParams.set("room", onlineRoomId);
      await navigator.clipboard.writeText(url.toString());
    } catch { }
    setInviteText("Copied!"); setTimeout(() => setInviteText("Invite"), 2000);
  };

  const handleCreateRoom = async () => {
    if (!p1.trim()) return;
    setOnlineLoading(true);
    const roomId = generateRoomId();
    const startId = getNextAvailableId([], intensityPref);
    try {
      await setDoc(doc(db, "rooms", roomId), {
        p1: p1.trim(),
        p2: "",
        history: [startId],
        histPos: 0,
        flipped: false,
        player: 1,
        intensityPref: intensityPref
      });
      setIsHost(true);
      setOnlineRoomId(roomId);
    } catch (e) {
      console.error(e);
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!p2.trim() || !roomIdInput.trim()) return;
    setOnlineLoading(true);
    try {
      const roomRef = doc(db, "rooms", roomIdInput.trim().toUpperCase());
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        await updateDoc(roomRef, { p2: p2.trim() });
        setIsHost(false);
        setOnlineRoomId(roomIdInput.trim().toUpperCase());
      } else {
        alert("Room not found.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOnlineLoading(false);
    }
  };

  const startLocalGame = () => {
    if (!p1.trim() || !p2.trim()) return;
    // Fresh Fisher-Yates shuffle per game so every session is unique
    setAll(prev => shuffleArray(prev));
    const startId = getNextAvailableId([], intensityPref);
    setHistory([startId]);
    setHistPos(0);
    setSkipped([]);
    setAnsweredCount(0);
    setFlipped(false);
    setPlayer(1);
    setGameStarted(true);
  };

  const p1Label = p1.trim() || "Player 1";
  const p2Label = p2.trim() || "Player 2";

  // ── SPLASH ──────────────────────────────────────────────────────
  if (mode === "splash") return (
    <>
      <LottieBackground />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center justify-center min-h-screen px-5 py-10 relative z-10 w-full max-w-[520px] mx-auto"
      >
        <div className="w-full max-w-[400px] text-center">
          <h1 className="font-sans text-[2.6rem] sm:text-[3.5rem] font-black tracking-[0.15em] sm:tracking-[0.25em] uppercase brand-gradient-text leading-none drop-shadow-[0_0_30px_rgba(123,107,191,0.3)]">Between Us</h1>
          <div className="text-[0.75rem] tracking-[0.3em] uppercase text-text-muted mt-6 font-medium opacity-90">Questions for the ones who matter</div>
          <div className="w-[60px] h-[1.5px] bg-linear-to-r from-transparent via-accent/50 to-transparent mx-auto my-10" />

          <div className="flex flex-col gap-5 mb-12">
            {/* Browse */}
            <motion.button
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setMode("browse"); setBrowseIdx(0); }}
              disabled={loading}
              className="group relative w-full bg-bg-panel/40 backdrop-blur-md border border-card-border/50 rounded-[24px] p-6 text-left transition-all duration-500 hover:border-accent/50 hover:bg-bg-panel/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(123,107,191,0.15)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors duration-500">
                  <Layers size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="font-sans text-[1.1rem] tracking-[0.12em] uppercase text-text-main font-bold mb-1">Browse Mode</div>
                  <div className="font-sans text-[0.85rem] text-text-muted tracking-wide font-medium">Explore the collection at your pace</div>
                </div>
                <div className="text-accent/40 group-hover:text-accent group-hover:translate-x-1 transition-all duration-500">→</div>
              </div>
            </motion.button>

            {/* Game */}
            <motion.button
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("game")}
              disabled={loading}
              className="group relative w-full bg-bg-panel/40 backdrop-blur-md border border-card-border/50 rounded-[24px] p-6 text-left transition-all duration-500 hover:border-accent-alt/50 hover:bg-bg-panel/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(197,184,232,0.15)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-accent-alt/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-accent-alt/10 border border-accent-alt/20 flex items-center justify-center shrink-0 group-hover:bg-accent-alt/20 transition-colors duration-500">
                  <Users size={24} className="text-accent-alt" />
                </div>
                <div className="flex-1">
                  <div className="font-sans text-[1.1rem] tracking-[0.12em] uppercase text-text-main font-bold mb-1">Game Mode</div>
                  <div className="font-sans text-[0.85rem] text-text-muted tracking-wide font-medium">Connect through shared questions</div>
                </div>
                <div className="text-accent-alt/40 group-hover:text-accent-alt group-hover:translate-x-1 transition-all duration-500">→</div>
              </div>
            </motion.button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-text-dim text-[0.62rem] tracking-widest uppercase font-sans">
              <Loader2 size={12} className="animate-spin" /><span>Preparing deck…</span>
            </div>
          )}
          {error && <div className="text-rose text-[0.62rem] tracking-widest uppercase font-sans">{error}</div>}
        </div>
      </motion.main>
    </>
  );

  // ── BROWSE ──────────────────────────────────────────────────────
  if (mode === "browse") return (
    <>
      <LottieBackground />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center min-h-screen relative z-10 w-full max-w-[420px] mx-auto px-5 pt-10 pb-24"
      >
        {/* Header */}
        <div className="w-full text-center mb-6 relative">
          <button onClick={() => setMode("splash")} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-sans text-[1.9rem] font-extrabold tracking-[0.2em] uppercase brand-gradient-text">Between Us</h1>
          <div className="text-[0.6rem] tracking-[0.24em] uppercase text-text-dim mt-1">Questions for the ones who matter</div>
          <div className="w-[30px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mt-3" />
        </div>

        {/* Filter pills */}
        <div className="w-full flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map(tab => (
            <button key={tab} onClick={() => { setFilter(tab); setBrowseIdx(0); }}
              className={`shrink-0 font-sans text-[0.72rem] tracking-[0.14em] uppercase rounded-full border px-4 py-2 transition-all duration-200 ${filter === tab
                ? "border-accent text-accent bg-[rgba(123,107,191,0.12)] shadow-[0_0_12px_rgba(123,107,191,0.22)]"
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
            <QuestionCard key={browseQ.id} question={browseQ} cardNumber={browseIdx + 1} total={filtered.length} />

            {/* Actions */}
            <div className="flex gap-3 mt-6 w-full">
              <button onClick={() => toggleSave(browseQ)}
                className={`flex items-center gap-2 font-sans text-[0.76rem] tracking-[0.12em] uppercase border rounded-full px-5 py-3 transition-all duration-200 ${isSavedBrowse ? "border-rose text-rose bg-[rgba(196,116,138,0.08)]" : "border-card-border text-text-muted hover:border-text-muted hover:text-text-main"
                  }`}>
                {isSavedBrowse ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                Save {isSavedBrowse ? "✓" : "♦"}
              </button>
              <button onClick={() => setBrowseIdx(i => (i + 1) % filtered.length)}
                className="flex-1 flex items-center justify-center gap-2 font-sans text-[0.76rem] tracking-[0.12em] uppercase border border-accent rounded-full px-5 py-3 text-accent transition-all duration-200 hover:bg-accent hover:text-bg-base shadow-[0_0_18px_rgba(123,107,191,0.25)]">
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
      </motion.main>
    </>
  );

  // ── GAME MODE ───────────────────────────────────────────────────
  if (mode === "game") {
    // Game Setup Screen
    if (!gameStarted) {
      if (onlineRoomId && isHost) {
        // Waiting Lobby for Host
        return (
          <>
            <LottieBackground />
            <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
              <div className="w-full max-w-[400px] text-center">
                <button onClick={() => { setOnlineRoomId(null); setMode("splash"); }} className="absolute top-8 left-5 text-text-dim hover:text-text-muted transition-colors p-1">
                  <ArrowLeft size={18} />
                </button>
                <h1 className="font-sans text-[2rem] font-extrabold tracking-[0.18em] uppercase brand-gradient-text mb-1">Between Us</h1>
                <div className="text-[0.62rem] tracking-[0.24em] uppercase text-text-dim mb-8">Waiting for partner...</div>

                <div className="bg-bg-panel border border-card-border rounded-2xl p-8 mb-6">
                  <div className="text-[0.68rem] tracking-[0.18em] uppercase text-text-muted mb-4">Room Code</div>
                  <div className="font-mono text-4xl tracking-[0.2em] text-accent font-medium mb-8">{onlineRoomId}</div>
                  <button onClick={invite}
                    className="w-full font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-accent-alt rounded-full px-5 py-3.5 text-accent-alt transition-all hover:bg-accent-alt hover:text-white flex items-center justify-center gap-2">
                    <Share2 size={15} /> {inviteText}
                  </button>
                </div>
                <p className="text-[0.68rem] tracking-wider text-text-muted">The game will start automatically when Player 2 joins.</p>
              </div>
            </main>
          </>
        );
      }

      return (
        <>
          <LottieBackground />
          <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
            <div className="w-full max-w-[400px] text-center">
              <button onClick={() => setMode("splash")} className="absolute top-8 left-5 text-text-dim hover:text-text-muted transition-colors p-1">
                <ArrowLeft size={18} />
              </button>
              <h1 className="font-serif text-[2rem] font-light tracking-[0.2em] uppercase text-accent mb-1">Between Us</h1>
              <div className="text-[0.62rem] tracking-[0.24em] uppercase text-text-white-bold mb-6">Game Mode Setup</div>

              <div className="flex bg-bg-panel border border-card-border rounded-full p-1 mb-8 w-max mx-auto">
                <button onClick={() => setPlayMode("local")} className={`px-6 py-2 rounded-full text-[0.68rem] tracking-widest uppercase transition-all ${playMode === "local" ? "bg-[rgba(201,169,110,0.15)] text-accent border border-[rgba(201,169,110,0.3)]" : "text-text-dim"}`}>Local</button>
                <button onClick={() => setPlayMode("online")} className={`px-6 py-2 rounded-full text-[0.68rem] tracking-widest uppercase transition-all ${playMode === "online" ? "bg-[rgba(201,169,110,0.15)] text-accent border border-[rgba(201,169,110,0.3)]" : "text-text-dim"}`}>Online</button>
              </div>

              <div className="text-[0.85rem] tracking-[0.18em] uppercase text-text-muted mb-6">Who is playing?</div>
              <div className="flex flex-col gap-3 mb-6">
                {playMode === "local" ? (
                  <>
                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p1" /><input type="text" placeholder="Player 1" value={p1} onChange={e => setP1(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p2" /><input type="text" placeholder="Player 2" value={p2} onChange={e => setP2(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                  </>
                ) : (
                  <>
                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p1" /><input type="text" placeholder="Your Name" value={roomIdInput ? p2 : p1} onChange={e => roomIdInput ? setP2(e.target.value) : setP1(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" ><Globe2 size={14} /></div><input type="text" placeholder="Room Code (Leave empty to create)" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value.toUpperCase())} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-10 text-text-main font-mono text-[1.05rem] font-light tracking-widest outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim placeholder:tracking-normal placeholder:font-sans placeholder:text-sm uppercase" maxLength={5} /></div>
                  </>
                )}
              </div>

              {(!roomIdInput || playMode === "local") && (
                <div className="mb-8 text-left">
                  <div className="text-[0.68rem] tracking-[0.18em] uppercase text-text-muted mb-3 text-center">Intensity</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ v: 1, l: "Mild" }, { v: 2, l: "Spicy" }, { v: 3, l: "Deep" }, { v: "random", l: "Random" }].map(({ v, l }) => (
                      <button key={v} onClick={() => setIntensityPref(v as any)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${intensityPref === v ? "border-rose bg-[rgba(196,116,138,0.1)]" : "border-card-border bg-bg-panel hover:border-text-muted"}`}>
                        <div className="flex">
                          {v === "random" ? <Layers size={14} className={intensityPref === v ? "text-rose" : "text-text-dim"} /> :
                            Array.from({ length: v as number }).map((_, i) => <Flame key={i} size={14} className={`fill-current ${intensityPref === v ? "text-rose" : "text-text-dim"}`} />)}
                        </div>
                        <span className={`text-[0.75rem] tracking-wider uppercase ${intensityPref === v ? "text-rose" : "text-text-dim"}`}>{l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading || onlineLoading ? (
                <div className="flex items-center justify-center gap-2 text-text-dim text-[0.62rem] tracking-widest uppercase font-sans mb-4">
                  <Loader2 size={12} className="animate-spin" /><span>Please wait…</span>
                </div>
              ) : (
                <button
                  onClick={playMode === "local" ? startLocalGame : (roomIdInput ? handleJoinRoom : handleCreateRoom)}
                  disabled={playMode === "local" ? (!p1.trim() || !p2.trim()) : (roomIdInput ? !p2.trim() : !p1.trim())}
                  className="w-full brand-gradient rounded-full py-4 px-6 text-white font-sans text-[0.82rem] tracking-[0.18em] uppercase cursor-pointer transition-all duration-300 relative overflow-hidden shadow-[0_0_24px_rgba(123,107,191,0.35)] hover:shadow-[0_0_32px_rgba(123,107,191,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
                  <span className="relative z-10">
                    {playMode === "local" ? "Begin Journey" : (roomIdInput ? "Join Room" : "Create Room")}
                  </span>
                </button>
              )}
            </div>
          </main>
        </>
      );
    }

    // Game screen
    const isMyTurn = !onlineRoomId ? true : (isHost && player === 1) || (!isHost && player === 2);

    // Header ← arrow: exit to game setup screen (keep player names, re-pick intensity)
    const exitToSetup = () => {
      setGameStarted(false);
      setOnlineRoomId(null);
      setHistory([]);
      setHistPos(-1);
      setFlipped(false);
      setSkipped([]);
      setAnsweredCount(0);
      // mode stays "game" → lands on setup screen, not splash
      try {
        sessionStorage.removeItem("bu_gameStarted");
        sessionStorage.removeItem("bu_history");
        sessionStorage.removeItem("bu_histPos");
        sessionStorage.removeItem("bu_answered");
        sessionStorage.setItem("bu_mode", "game");
      } catch {}
    };

    return (
      <>
        <LottieBackground />
        {/* Exit button: fixed position, always on top */}
        <button
          onClick={exitToSetup}
          className="fixed top-8 left-5 z-50 text-text-dim hover:text-text-muted transition-colors p-3 rounded-full hover:bg-white/5"
          title="Back to setup"
          aria-label="Back to setup"
        >
          <ArrowLeft size={22} />
        </button>
        {onlineRoomId && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed top-8 right-5 z-50 text-text-dim hover:text-text-muted transition-colors p-3 rounded-full hover:bg-white/5 relative"
            title="Open Chat"
            aria-label="Open Chat"
          >
            <MessageCircle size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-bg-panel min-w-[18px] h-[18px] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        <main className="relative z-10 w-full max-w-[520px] px-6 py-10 pb-20 flex flex-col items-center min-h-screen mx-auto">
          <header className="w-full text-center mb-8">
            <h1 className="font-sans text-[1.7rem] font-extrabold tracking-[0.16em] uppercase brand-gradient-text">Between Us</h1>
            <div className="w-[30px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mt-2" />
          </header>

          {/* Turn indicator */}
          <div className="w-full max-w-[380px] flex gap-2 mb-8 bg-bg-panel border border-card-border rounded-full p-1.5">
            {([1, 2] as const).map(p => (
              <div key={p} onClick={() => { if (!onlineRoomId || isMyTurn) updatePlayerTurn(p); }}
                className={`flex-1 text-center py-2 px-3 rounded-full text-[0.85rem] tracking-widest uppercase transition-all duration-300 ${(!onlineRoomId || isMyTurn) ? 'cursor-pointer' : 'cursor-default'} overflow-hidden text-ellipsis whitespace-nowrap ${player === p
                  ? p === 1 ? "bg-[rgba(201,169,110,0.15)] text-p1 border border-[rgba(201,169,110,0.3)]" : "bg-[rgba(155,111,168,0.15)] text-p2 border border-[rgba(155,111,168,0.3)]"
                  : "text-text-dim border border-transparent"
                  }`}>
                {p === 1 ? p1Label : p2Label}
              </div>
            ))}
          </div>

          {gameQ
            ? <FlipCard question={gameQ} isFlipped={flipped} onFlip={() => updateFlipped(true)} activePlayer={player} cardNumber={histPos + 1} disabled={!isMyTurn} />
            : <div className="text-text-dim text-sm tracking-widest uppercase font-sans flex-1 flex items-center">No questions available.</div>
          }

          <div className="flex gap-2 flex-wrap justify-center mt-6 w-full max-w-[360px]">
            <button
              onClick={prevGame}
              disabled={histPos <= 0 || !isMyTurn}
              className="font-sans text-[0.75rem] tracking-[0.1em] uppercase border border-card-border rounded-full px-4 py-2.5 text-text-muted transition-all hover:text-text-main hover:border-text-muted disabled:opacity-40 flex items-center gap-1.5"
              title="Previous question"
            >
              <ArrowLeft size={13} /> Prev
            </button>
            <button onClick={() => gameQ && toggleSave(gameQ)}
              className={`font-sans text-[0.75rem] tracking-[0.1em] uppercase border rounded-full px-4 py-2.5 transition-all flex items-center gap-1.5 ${isSavedGame ? "border-rose text-rose" : "border-card-border text-text-muted hover:border-text-muted hover:text-text-main"
                }`}>
              {isSavedGame ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} Save
            </button>
            <button onClick={skipGame} disabled={!isMyTurn}
              className="font-sans text-[0.75rem] tracking-[0.1em] uppercase border border-card-border rounded-full px-4 py-2.5 text-text-dim transition-all hover:text-text-muted hover:border-text-dim disabled:opacity-40 flex items-center gap-1.5"
              title="Skip this question — it can come back later">
              <SkipForward size={13} /> Skip
            </button>
            <button onClick={nextGame} disabled={!isMyTurn || !flipped}
              className="font-sans text-[0.75rem] tracking-[0.1em] uppercase brand-gradient rounded-full px-4 py-2.5 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(123,107,191,0.3)] flex-1 min-w-[100px]">
              Next →
            </button>
            {onlineRoomId && (
              <button onClick={invite}
                className="font-sans text-[0.68rem] tracking-[0.12em] uppercase border border-accent-alt rounded-full px-4 py-2.5 text-accent-alt transition-all hover:bg-accent-alt hover:text-white flex items-center gap-1.5">
                <Share2 size={13} /> {inviteText}
              </button>
            )}
          </div>

          {/* Journey bar hidden per user request */}

          <div className="w-full max-w-[360px] flex gap-2 mt-5">
            {[
              { label: p1Label, val: Math.ceil(answeredCount / 2), cls: "text-p1" },
              { label: "Answered", val: answeredCount, cls: "text-text-main" },
              { label: "Skipped", val: skipped.length, cls: "text-text-dim" },
              { label: p2Label, val: Math.floor(answeredCount / 2), cls: "text-p2" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex-1 bg-bg-panel border border-card-border rounded-xl p-3 text-center">
                <div className={`text-[0.6rem] tracking-[0.1em] uppercase mb-1 overflow-hidden text-ellipsis whitespace-nowrap ${cls}`}>{label}</div>
                <div className={`font-sans text-[1.4rem] font-bold ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </main>

        {onlineRoomId && (
          <ChatOverlay
            roomId={onlineRoomId}
            currentPlayerName={isHost ? p1Label : p2Label}
            playerRole={isHost ? "p1" : "p2"}
            messages={messages}
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        )}
      </>
    );
  }

  return null;
}
