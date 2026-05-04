"use client";

import { useState, useEffect } from "react";
import FlipCard from "@/components/FlipCard";
import QuestionCard from "@/components/QuestionCard";
import { Question } from "@/lib/questions";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { ArrowLeft, Share2, Loader2, Bookmark, BookmarkCheck, Layers, Users, Flame, Globe2 } from "lucide-react";

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
        
        // Parse URL params
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

  const getNextAvailableId = (currentHistory: string[], desiredIntensity: number | "random") => {
    const validIds = all
      .filter(q => desiredIntensity === "random" || q.intensity === desiredIntensity)
      .map(q => q.id);
    const avail = validIds.filter(id => !currentHistory.includes(id));
    return avail.length ? avail[Math.floor(Math.random() * avail.length)] : (validIds.length ? validIds[Math.floor(Math.random() * validIds.length)] : all[Math.floor(Math.random() * all.length)].id);
  };

  const nextGame = () => {
    updateFlipped(false);
    setTimeout(() => {
      const next = getNextAvailableId(history, intensityPref);
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
    } catch {}
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
    const startId = getNextAvailableId([], intensityPref);
    setHistory([startId]);
    setHistPos(0);
    setGameStarted(true);
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
    // Game Setup Screen
    if (!gameStarted) {
      if (onlineRoomId && isHost) {
        // Waiting Lobby for Host
        return (
          <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
            <div className="w-full max-w-[400px] text-center">
              <button onClick={() => { setOnlineRoomId(null); setMode("splash"); }} className="absolute top-8 left-5 text-text-dim hover:text-text-muted transition-colors p-1">
                <ArrowLeft size={18} />
              </button>
              <h1 className="font-serif text-[2rem] font-light tracking-[0.2em] uppercase text-accent mb-1">Between Us</h1>
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
        );
      }

      return (
        <main className="flex items-center justify-center min-h-screen px-6 py-10 relative z-10 w-full max-w-[520px] mx-auto">
          <div className="w-full max-w-[400px] text-center">
            <button onClick={() => setMode("splash")} className="absolute top-8 left-5 text-text-dim hover:text-text-muted transition-colors p-1">
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-serif text-[2rem] font-light tracking-[0.2em] uppercase text-accent mb-1">Between Us</h1>
            <div className="text-[0.62rem] tracking-[0.24em] uppercase text-text-dim mb-6">Game Mode Setup</div>
            
            <div className="flex bg-bg-panel border border-card-border rounded-full p-1 mb-8 w-max mx-auto">
              <button onClick={() => setPlayMode("local")} className={`px-6 py-2 rounded-full text-[0.68rem] tracking-widest uppercase transition-all ${playMode === "local" ? "bg-[rgba(201,169,110,0.15)] text-accent border border-[rgba(201,169,110,0.3)]" : "text-text-dim"}`}>Local</button>
              <button onClick={() => setPlayMode("online")} className={`px-6 py-2 rounded-full text-[0.68rem] tracking-widest uppercase transition-all ${playMode === "online" ? "bg-[rgba(201,169,110,0.15)] text-accent border border-[rgba(201,169,110,0.3)]" : "text-text-dim"}`}>Online</button>
            </div>

            <div className="text-[0.68rem] tracking-[0.18em] uppercase text-text-muted mb-4">Who is playing?</div>
            <div className="flex flex-col gap-3 mb-6">
              {playMode === "local" ? (
                <>
                  <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p1" /><input type="text" placeholder="Player 1" value={p1} onChange={e => setP1(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                  <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p2" /><input type="text" placeholder="Player 2" value={p2} onChange={e => setP2(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                </>
              ) : (
                <>
                  <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-p1" /><input type="text" placeholder="Your Name" value={roomIdInput ? p2 : p1} onChange={e => roomIdInput ? setP2(e.target.value) : setP1(e.target.value)} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-9 text-text-main font-serif text-[1.05rem] font-light tracking-wide outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim" /></div>
                  <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" ><Globe2 size={14}/></div><input type="text" placeholder="Room Code (Leave empty to create)" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value.toUpperCase())} className="w-full bg-bg-panel border border-card-border rounded-xl py-3.5 pr-4 pl-10 text-text-main font-mono text-[1.05rem] font-light tracking-widest outline-none transition-all duration-200 focus:border-text-muted focus:ring-2 focus:ring-[rgba(155,111,168,0.12)] placeholder:text-text-dim placeholder:tracking-normal placeholder:font-sans placeholder:text-sm uppercase" maxLength={5} /></div>
                </>
              )}
            </div>

            {(!roomIdInput || playMode === "local") && (
              <div className="mb-8 text-left">
                <div className="text-[0.68rem] tracking-[0.18em] uppercase text-text-muted mb-3 text-center">Intensity</div>
                <div className="grid grid-cols-4 gap-2">
                  {[{v:1, l:"Mild"}, {v:2, l:"Spicy"}, {v:3, l:"Deep"}, {v:"random", l:"Random"}].map(({v,l}) => (
                    <button key={v} onClick={() => setIntensityPref(v as any)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${intensityPref === v ? "border-rose bg-[rgba(196,116,138,0.1)]" : "border-card-border bg-bg-panel hover:border-text-muted"}`}>
                      <div className="flex">
                        {v === "random" ? <Layers size={14} className={intensityPref === v ? "text-rose" : "text-text-dim"}/> : 
                         Array.from({length: v as number}).map((_, i) => <Flame key={i} size={14} className={`fill-current ${intensityPref === v ? "text-rose" : "text-text-dim"}`} />)}
                      </div>
                      <span className={`text-[0.55rem] tracking-wider uppercase ${intensityPref === v ? "text-rose" : "text-text-dim"}`}>{l}</span>
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
                className="w-full bg-transparent border border-accent rounded-full py-3.5 px-6 text-accent font-sans text-[0.7rem] tracking-[0.2em] uppercase cursor-pointer transition-all duration-300 relative overflow-hidden group hover:text-bg-base disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">
                  {playMode === "local" ? "Begin Journey" : (roomIdInput ? "Join Room" : "Create Room")}
                </span>
              </button>
            )}
          </div>
        </main>
      );
    }

    // Game screen
    const isMyTurn = !onlineRoomId ? true : (isHost && player === 1) || (!isHost && player === 2);

    return (
      <main className="relative z-10 w-full max-w-[520px] px-6 py-10 pb-20 flex flex-col items-center min-h-screen mx-auto">
        <header className="w-full text-center mb-8 relative">
          <button onClick={() => { setGameStarted(false); setOnlineRoomId(null); }} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors p-1">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif text-[1.7rem] font-light tracking-[0.2em] uppercase text-accent">Between Us</h1>
          <div className="w-[30px] h-px bg-linear-to-r from-transparent via-accent to-transparent mx-auto mt-2" />
        </header>

        {/* Turn indicator */}
        <div className="w-full max-w-[380px] flex gap-2 mb-8 bg-bg-panel border border-card-border rounded-full p-1.5">
          {([1, 2] as const).map(p => (
            <div key={p} onClick={() => { if (!onlineRoomId || isMyTurn) updatePlayerTurn(p); }}
              className={`flex-1 text-center py-2 px-3 rounded-full text-[0.68rem] tracking-widest uppercase transition-all duration-300 ${(!onlineRoomId || isMyTurn) ? 'cursor-pointer' : 'cursor-default'} overflow-hidden text-ellipsis whitespace-nowrap ${
                player === p
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

        <div className="flex gap-2.5 flex-wrap justify-center mt-6 w-full max-w-[360px]">
          <button onClick={prevGame} disabled={histPos <= 0 || !isMyTurn}
            className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-card-border rounded-full px-5 py-2.5 text-text-muted transition-all hover:text-text-main hover:border-text-muted disabled:opacity-40 flex items-center gap-2">
            <ArrowLeft size={13} /> Back
          </button>
          <button onClick={() => gameQ && toggleSave(gameQ)}
            className={`font-sans text-[0.68rem] tracking-[0.14em] uppercase border rounded-full px-5 py-2.5 transition-all flex items-center gap-2 ${
              isSavedGame ? "border-rose text-rose" : "border-card-border text-text-muted hover:border-text-muted hover:text-text-main"
            }`}>
            {isSavedGame ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} Save
          </button>
          <button onClick={nextGame} disabled={!isMyTurn}
            className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-accent rounded-full px-5 py-2.5 text-accent transition-all hover:bg-accent hover:text-bg-base disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,169,110,0.25)] flex-1 min-w-[110px]">
            Next Card
          </button>
          {onlineRoomId && (
            <button onClick={invite}
              className="font-sans text-[0.68rem] tracking-[0.14em] uppercase border border-accent-alt rounded-full px-5 py-2.5 text-accent-alt transition-all hover:bg-accent-alt hover:text-white flex items-center gap-2">
              <Share2 size={13} /> {inviteText}
            </button>
          )}
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
