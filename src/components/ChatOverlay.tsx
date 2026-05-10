import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import { ChatMessage } from "@/hooks/useChat";

const VoiceControls = dynamic(() => import("./VoiceControls"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-white/10 h-8 w-24 rounded-full" />
});

interface ChatOverlayProps {
  roomId: string;
  currentPlayerName: string;
  playerRole: "p1" | "p2";
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatOverlay({ roomId, currentPlayerName, playerRole, messages, isOpen, onClose }: ChatOverlayProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const msg = newMessage.trim();
    setNewMessage("");

    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text: msg,
      senderName: currentPlayerName,
      timestamp: serverTimestamp()
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-bg-base border-l border-card-border z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-card-border flex items-center justify-between bg-bg-panel">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-accent" />
                <h2 className="font-sans font-bold tracking-widest text-[0.85rem] uppercase text-text-main">Room Chat</h2>
              </div>
              <div className="flex items-center gap-3">
                <VoiceControls roomId={roomId} playerRole={playerRole} />
                <button onClick={onClose} className="p-2 text-text-dim hover:text-text-main transition-colors rounded-full hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-text-dim text-sm tracking-wide text-center">
                  No messages yet.<br/>Say hi!
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderName === currentPlayerName;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[0.65rem] text-text-dim mb-1 tracking-wider uppercase px-1">{msg.senderName}</span>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[0.95rem] ${isMe ? "bg-accent text-white rounded-tr-sm" : "bg-bg-panel border border-card-border text-text-main rounded-tl-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-card-border bg-bg-panel">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-bg-base border border-card-border rounded-full py-3 pl-5 pr-12 text-text-main text-[0.95rem] outline-none focus:border-accent transition-colors placeholder:text-text-dim"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 p-2 text-accent disabled:text-text-dim transition-colors hover:bg-white/5 rounded-full"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
