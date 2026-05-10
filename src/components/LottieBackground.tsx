"use client";

import React from "react";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";

const LottieBackground = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: -10,
        pointerEvents: "none",
      }}
    >
      {/* Deep navy-purple base layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(60, 80, 140, 0.45) 0%, transparent 65%), " +
            "radial-gradient(ellipse 70% 50% at 30% 60%, rgba(90, 60, 140, 0.20) 0%, transparent 65%), " +
            "linear-gradient(170deg, #08102A 0%, #0C1530 35%, #0A1228 65%, #060A18 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Gravity Stars — interactive, hardware-accelerated canvas */}
      <GravityStarsBackground
        className="absolute inset-0 w-full h-full"
        style={{ color: "rgba(200, 185, 255, 0.85)", background: "transparent", pointerEvents: "auto" }}
        starsCount={90}
        starsSize={1.8}
        starsOpacity={0.72}
        glowIntensity={12}
        glowAnimation="ease"
        movementSpeed={0.25}
        mouseInfluence={120}
        mouseGravity="attract"
        gravityStrength={60}
        starsInteraction={false}
      />

      {/* Top/bottom fade for header & footer readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(8,14,30,0.55) 0%, transparent 20%, transparent 75%, rgba(6,10,22,0.65) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default LottieBackground;
