<div align="center">
  
  # 🌌 Between Us
  
  **A premium, dual-mode conversation engine designed to spark deep, funny, and unforgettable moments.**

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase_11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Agora_RTC-0096FF?style=for-the-badge&logo=agora&logoColor=white" alt="Agora" />
    <img src="https://img.shields.io/badge/Framer_Motion_12-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  </p>

  <br />

  ![App Preview](./public/how%20homepage%20is%20looking.jpeg)
  
  <div style="display: flex; gap: 10px; justify-content: center;">
    <img src="./public/mobile%20view.png" width="30%" alt="Mobile View" />
  </div>

</div>

---

## ✨ Overview

**Between Us** is a high-fidelity web application crafted for Pakistani students and young adults to build deeper connections. It blends an intimate **dark-purple aesthetic** with modern **glassmorphism** and real-time communication tools. Whether you're exploring solo or engaging in a private session with a partner, the experience is designed to be immersive, responsive, and alive.

---

## 🚀 Key Features

### 🎧 Real-Time Interaction
- **Crystal Clear Voice**: Integrated **Agora RTC** for secure, low-latency audio calls directly within the app.
- **Private Chat Overlay**: A sleek, persistent chat interface powered by **Firebase Firestore** for real-time messaging during gameplay.
- **Synced Sessions**: Stay connected with your partner through synchronized room-based interactions.

### 🔍 Browse Mode (Solo Exploration)
- **Mood-Based Filtering**: Discover questions tailored to your vibe: `DEEP`, `FUN`, `US`, `WHAT IF`, and `LATE NIGHT`.
- **Intelligent Tracking**: Dynamic progress indicators and "EXPLORED" markers help you keep track of your journey.
- **Animated Navigation**: Smooth transitions and card discovery powered by Framer Motion.

### 🎮 Game Mode (2-Player Duel)
- **3D Interactive Cards**: Premium flip animations and physical card interactions.
- **Personalized Turns**: Dynamic UI shifts between `Player 1` and `Player 2` with color-coded prompts and indicators.
- **Lottie Backgrounds**: An immersive "Underwater Ocean" environment with animated fish and turtles for a calming atmosphere.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) & [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first configuration)
- **Real-time**: [Agora SDK](https://www.agora.io/) (Voice) & [Firebase Firestore](https://firebase.google.com/) (Chat)
- **Motion**: [Framer Motion 12](https://www.framer.com/motion/) & [Lottie React](https://lottiefiles.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Animate-UI](https://animate.style/)

---

## 💻 Getting Started

### Prerequisites
- Node.js 20+ 
- Firebase Project
- Agora App ID

### Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/devd-328/Between-Us.git
   cd Between-Us
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Agora
   NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Highlights

- **`src/components/ChatOverlay.tsx`**: The core real-time messaging interface.
* **`src/components/VoiceControls.tsx`**: Agora RTC call management.
* **`src/components/LottieBackground.tsx`**: Dynamic animated environments.
* **`src/app/globals.css`**: The central design system and glassmorphism definitions.

---

<div align="center">
  <p><i>"Bridging the distance, one question at a time."</i></p>
  <b>Built with ❤️ for GatherPK</b>
</div>
