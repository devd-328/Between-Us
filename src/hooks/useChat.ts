import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  text: string;
  senderName: string;
  timestamp: any;
}

export function useChat(roomId: string | null, isOpen: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedCount, setLastViewedCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach(d => {
        msgs.push({ id: d.id, ...d.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setLastViewedCount(messages.length);
    } else {
      if (messages.length > lastViewedCount) {
        setUnreadCount(messages.length - lastViewedCount);
        
        // Optional: play sound here if messages increased
        if (messages.length > 0) {
           playNotificationSound();
        }
      }
    }
  }, [messages.length, isOpen]);

  return { messages, unreadCount };
}

function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.warn("Failed to play notification sound", e);
  }
}
