"use client";

import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Loader2, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useJoin,
  usePublish,
  useRemoteUsers,
  useRemoteAudioTracks,
} from "agora-rtc-react";

// Initialize client only on the client-side
const getClient = () => {
  if (typeof window === "undefined") return null;
  return AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
};

// Replace this with your actual Agora App ID in production
const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
const channelName = "test";

export default function VoiceControls({ roomId, playerRole }: { roomId: string, playerRole: "p1" | "p2" }) {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const rtcClient = getClient();
    if (rtcClient) {
      setClient(rtcClient);
    }
  }, []);

  if (!client) return null;

  return (
    <AgoraRTCProvider client={client}>
      <VoiceChannel roomId={roomId} appId={appId} playerRole={playerRole} />
    </AgoraRTCProvider>
  );
}

function VoiceChannel({ roomId, appId, playerRole }: { roomId: string, appId: string, playerRole: "p1" | "p2" }) {
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [otherInVoice, setOtherInVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const otherRole = playerRole === "p1" ? "v2" : "v1";
        setOtherInVoice(!!data[otherRole]);
      }
    });
    return () => unsub();
  }, [roomId, playerRole]);

  useEffect(() => {
    if (!roomId) return;
    const updateVoiceStatus = async (status: boolean) => {
      try {
        await updateDoc(doc(db, "rooms", roomId), {
          [playerRole === "p1" ? "v1" : "v2"]: status
        });
      } catch (e) {
        console.error("Failed to update voice status", e);
      }
    };

    updateVoiceStatus(joined);

    return () => {
      updateVoiceStatus(false);
    };
  }, [joined, roomId, playerRole]);

  // useJoin hooks automatically joins when the second argument is true
  const { isLoading: isJoiningCall } = useJoin({ 
    appid: appId, 
    channel: roomId, 
    token: token 
  }, joined && !!appId && !!token);
  
  const isJoining = isJoiningCall || isFetchingToken;

  // Create local mic track only when joined
  const { localMicrophoneTrack, isLoading: isMicLoading } = useLocalMicrophoneTrack(joined);
  
  // Publish local mic track
  usePublish([localMicrophoneTrack]);

  // Subscribe to remote users
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Handle local microphone mute/unmute
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(!micOn);
    }
  }, [micOn, localMicrophoneTrack]);

  // Handle remote audio speaker mute/unmute
  useEffect(() => {
    audioTracks.forEach((track) => {
      // Safely set volume
      track.setVolume(speakerOn ? 100 : 0);
    });
  }, [audioTracks, speakerOn]);

  return (
    <div className="flex items-center gap-3">
      {/* Other user status */}
      {otherInVoice && !joined && (
        <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full animate-pulse">
          <Users size={12} className="text-green-500" />
          <span className="text-[0.6rem] text-green-500 font-bold uppercase tracking-tighter">Partner in Voice</span>
        </div>
      )}
      
      {/* Join / Leave Call */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={async () => {
          if (!appId) {
            console.error("Agora: Missing App ID. Please set NEXT_PUBLIC_AGORA_APP_ID in your .env file.");
            alert("Voice features require an Agora App ID. Please configure it in your environment variables.");
            return;
          }

          if (!joined) {
            setIsFetchingToken(true);
            try {
              const res = await fetch(`/api/token?channelName=${roomId}`);
              const data = await res.json();
              if (data.token) {
                setToken(data.token);
                setJoined(true);
              } else {
                throw new Error(data.error || "Failed to get token");
              }
            } catch (e) {
              console.error("Token fetch failed:", e);
              alert("Security Check: Failed to generate a voice token. Make sure you added AGORA_APP_CERTIFICATE to your .env.local file.");
            } finally {
              setIsFetchingToken(false);
            }
          } else {
            setJoined(false);
            setToken(null);
          }
        }}
        disabled={isJoining}
        className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
          joined
            ? "bg-red-500/20 text-red-500 border-red-500/40"
            : "bg-green-500/20 text-green-500 border-green-500/40 hover:bg-green-500/30"
        } disabled:opacity-50`}
        title={joined ? "Leave Voice Call" : "Join Voice Call"}
      >
        {isJoining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : joined ? (
          <PhoneOff size={18} />
        ) : (
          <Phone size={18} />
        )}
      </motion.button>

      {/* Mic and Speaker Controls */}
      {joined && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMicOn(!micOn)}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
              micOn
                ? "bg-[rgba(123,107,191,0.15)] text-accent border-accent/40"
                : "bg-bg-panel text-text-dim border-card-border hover:border-text-dim"
            }`}
            title={micOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-text-dim" />
            ) : micOn ? (
              <Mic size={18} />
            ) : (
              <MicOff size={18} />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
              speakerOn
                ? "bg-[rgba(123,107,191,0.15)] text-accent border-accent/40"
                : "bg-bg-panel text-text-dim border-card-border hover:border-text-dim"
            }`}
            title={speakerOn ? "Mute Speaker" : "Unmute Speaker"}
          >
            {speakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </motion.button>
        </>
      )}
    </div>
  );
}
