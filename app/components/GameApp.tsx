"use client";

import React, { useState } from "react";
import { AppScreen, Player } from "../types";
import RegistrationScreen from "./RegistrationScreen";
import CoachTipsScreen from "./HowToPlay";
import LeaderboardScreen from "./GameOver";
import ChickenRoadGame from "./PenaltyGame";
import QrScanned from "./QrScanned";
import { CountryId, DEFAULT_COUNTRY } from "../data/countries";

import "material-symbols/outlined.css";

export default function GameApp({ token }: { token: string }) {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.REGISTRATION);
  const [player, setPlayer] = useState<Player>({
    name: "",
    phone: "",
    points: 0,
    rank: 0,
    credits: 0,
    country: DEFAULT_COUNTRY,
  });

  const handleRegister = async (
    name: string,
    phone: string,
    country: CountryId
  ) => {
    const response = await fetch("/api/game/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, phone }),
    });

    if (response.status === 409 || response.status === 404) {
      setScreen(AppScreen.CODE_USED);
      throw new Error("This QR code has already been used.");
    }
    if (!response.ok) {
      throw new Error("We could not start the game. Please try again.");
    }

    setPlayer((previous) => ({ ...previous, name, phone, country }));
    setScreen(AppScreen.COACH_TIPS);
  };

  const handleGameFinished = async (pointsWon: number) => {
    setPlayer((previous) => ({ ...previous, points: pointsWon }));

    try {
      await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: pointsWon }),
      });
    } finally {
      setScreen(AppScreen.LEADERBOARD);
    }
  };

  const getBackgroundStyle = () => {
    if (screen === AppScreen.REGISTRATION) return { backgroundColor: "#ffdcc4" };
    if (screen === AppScreen.GAMEPLAY) return { backgroundColor: "#040409" };
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
      {screen === AppScreen.GAMEPLAY && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(#1c1b1b 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      <main className="flex-grow flex flex-col items-center justify-center relative z-10 p-4">
        {screen === AppScreen.REGISTRATION && (
          <RegistrationScreen onRegister={handleRegister} />
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
        {screen === AppScreen.CODE_USED && <QrScanned />}
      </main>
    </div>
  );
}
