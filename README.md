<div align="center">
  
  # 🌌 Between Us

  **A beautifully crafted, dual-mode question generator to spark deep, funny, and memorable conversations.**

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  </p>
</div>

---

## ✨ Overview

**Between Us** is a modern web application designed to bring people closer through meaningful questions. Whether you're exploring questions on your own or playing a turn-based game with a partner, the app provides a seamless and visually stunning experience.

Featuring a rich **dark-purple aesthetic**, frosted glass UI elements (glassmorphism), and subtle noise overlays, the design feels premium and intimate.

## 🚀 Features

### 🔍 Browse Mode (Solo Exploration)
- **Category Filtering:** Filter questions by specific moods—`DEEP`, `FUN`, `US`, `WHAT IF`, and `LATE NIGHT`.
- **Progress Tracking:** Keep track of the questions you've seen with dynamic "X of Y" indicators and an "EXPLORED" status marker.
- **Instant Discovery:** Swipe or click through static cards to effortlessly discover new conversation starters.

### 🎮 Game Mode (2-Player Interaction)
- **Turn-Based Gameplay:** Designed specifically for two people, alternating turns with personalized player styling.
- **Interactive 3D Cards:** Fluid, 3D flip-card animations powered by Framer Motion and Tailwind v4.
- **Engaging UI:** Player-specific colors (`Player 1` vs `Player 2`) clearly indicate whose turn it is to answer.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Database:** [Firebase Firestore](https://firebase.google.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 💻 Getting Started

Follow these instructions to run the project locally.

### Prerequisites
Make sure you have Node.js and npm (or yarn/pnpm/bun) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devd-328/Between-Us.git
   cd Between-Us
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install / pnpm install
   ```

3. **Set up Firebase configuration:**
   Make sure you have your Firebase configuration set up in `src/lib/firebase.ts`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Project Structure

```text
Between-Us/
├── src/
│   ├── app/
│   │   ├── globals.css        # Tailwind v4 configuration & custom CSS variables
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # Main application entry (Splash, Browse, and Game modes)
│   ├── components/
│   │   ├── FlipCard.tsx       # 3D interactive card for Game Mode
│   │   └── QuestionCard.tsx   # Static display card for Browse Mode
│   └── lib/
│       └── firebase.ts        # Firebase database initialization
├── parsed_questions.json      # Backup JSON of questions
├── public/                    # Static assets
└── next.config.ts             # Next.js configuration
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/devd-328/Between-Us/issues) if you want to contribute.

---
<div align="center">
  <i>Built with ❤️ to spark better conversations.</i>
</div>

