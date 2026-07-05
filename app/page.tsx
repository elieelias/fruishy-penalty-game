"use client";
import React, { useState } from "react";
import { AppScreen, Player } from "./types";
import RegistrationScreen from "./components/RegistrationScreen";
import CoachTipsScreen from "./components/HowToPlay";
import LeaderboardScreen from "./components/GameOver";
import ChickenRoadGame from "./components/PenaltyGame";
import { CountryId, DEFAULT_COUNTRY } from "./data/countries";

import 'material-symbols/outlined.css';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.REGISTRATION);
  const [player, setPlayer] = useState<Player>({
    name: "",
    phone: "",
    points: 0,
    rank: 0,
    credits: 0,
    country: DEFAULT_COUNTRY,
  });

  const handleRegister = (name: string, phone: string, country: CountryId) => {
    setPlayer((prev) => ({
      ...prev,
      name,
      phone,
      country,
    }));
    setScreen(AppScreen.COACH_TIPS);
  };

  const handleGameFinished = (pointsWon: number) => {
    setPlayer((prev) => ({
      ...prev,
      points: prev.points + pointsWon,
    }));
    setScreen(AppScreen.LEADERBOARD);
  };

  // Determine background based on screen matching the high-fidelity mockups
  const getBackgroundStyle = () => {
    if (screen === AppScreen.REGISTRATION) {
      return {
        backgroundColor: "#ffdcc4",
      };
    }
    if (screen === AppScreen.GAMEPLAY) {
      return {
        backgroundColor: "#040409",
      };
    }
    // Leaderboard, Tips:
    return {
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(255,138,0,0.18) 0%, transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(120,252,77,0.18) 0%, transparent 40%)
      `,
      backgroundColor: "#fcf9f8",
    };
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-secondary-container selection:text-on-secondary-container transition-all duration-500"
      style={getBackgroundStyle()}
    >
      {/* Decorative Background Elements on Game screen */}
      {screen === AppScreen.GAMEPLAY && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(#1c1b1b 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        ></div>
      )}

      {/* Floating background aesthetic elements for other screens */}
      {screen !== AppScreen.REGISTRATION && screen !== AppScreen.GAMEPLAY && (
        <>
          <div className="fixed top-20 left-10 opacity-5 pointer-events-none z-0 animate-bounce">
            {/*<span className="material-symbols-outlined text-[120px] select-none">sports_soccer</span>*/}
          </div>
          <div className="fixed bottom-40 right-10 opacity-5 pointer-events-none z-0 animate-pulse">
            {/*<span className="material-symbols-outlined text-[100px] select-none">local_drink</span>*/}
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 p-4">
        {screen === AppScreen.REGISTRATION && (
          <RegistrationScreen
            onRegister={handleRegister}
          />
        )}

        {screen === AppScreen.COACH_TIPS && (
          <CoachTipsScreen
            playerName={player.name}
            onPlay={() => setScreen(AppScreen.GAMEPLAY)}
          />
        )}

        {screen === AppScreen.GAMEPLAY && (
          <ChickenRoadGame
            country={player.country}
            onGameFinished={handleGameFinished}
          />
        )}

        {screen === AppScreen.LEADERBOARD && (
          <LeaderboardScreen
            userName={player.name}
            userPoints={player.points}
          />
        )}
      </main>
    </div>
  );
}
