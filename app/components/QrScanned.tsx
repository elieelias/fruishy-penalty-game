"use client";

import React from "react";

interface CodeUsedScreenProps {
    onBackToRedeem?: () => void;
    onBackToHome?: () => void;
}

export default function CodeUsedScreen({
    onBackToRedeem = () => window.location.assign("/"),
    onBackToHome = () => window.location.assign("/"),
}: CodeUsedScreenProps) {
    return (
        <div className="flex-grow flex flex-col items-center justify-center px-4 pt-16 pb-32 relative z-10 w-full max-w-lg mx-auto">
            {/* Error Container Card */}
            <div className="w-full bg-tertiary-fixed border-4 border-on-background neo-shadow-lg rounded-xl overflow-hidden flex flex-col items-center text-center p-8 relative">
                {/* Pattern Overlay (Visual Polish) */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(#1c1b1b 2px, transparent 2px)",
                        backgroundSize: "20px 20px",
                    }}
                ></div>

                {/* Illustration Area */}
                <div className="relative w-full aspect-square max-w-[240px] mb-6 animate-float z-10">
                    <img
                        alt="Fruishy mascot character"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-xl"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDitnptQ2MDEvRdGCRZBkbr6L9rQKtftMGrGZZFI-r8eKimfvaw3nMRGM_1ngYSfS-Lmr5h-TRZK7WfuHr2p8z9Ud48RcEZdIpWHTO1cYtSnZbgjRde3J2zkl9WHB8sEIBUlcATmBO7ItysuARlpZDSUZhBn69larDerd7cbvF_8nDq3LW_Kp1c_TnooimXmYAXw5FWSkLDUknmi2_V_zOZtoYl2E3G5zZ0Ej0cPKYadV1bDtz074fRAMm3E3mbM6ytjLaHN9Fx215j"
                    />
                    {/* Warning Badge */}
                    <div className="absolute top-2 right-2 bg-error text-white p-2 rounded-full border-4 border-on-background neo-shadow animate-bounce">
                        <span
                            className="material-symbols-outlined text-2xl font-bold flex items-center justify-center select-none"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            warning
                        </span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="z-10">
                    <h2 className="font-headline-lg-mobile text-3xl font-black text-on-background mb-4 uppercase leading-none select-none">
                        UH-OH! THIS CODE IS USED
                    </h2>
                    <p className="font-body-md text-sm text-on-surface-variant mb-6 px-2 leading-relaxed">
                        It looks like this QR code has already been scanned. Grab a fresh juice or popcorn to get a new code and play again!
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-3 z-10">
                    <button
                        onClick={onBackToRedeem}
                        className="w-full bg-primary-container text-on-primary-container font-headline-lg-mobile text-lg uppercase rounded-lg py-4 border-3 border-on-background hard-shadow hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1c1b1b] transition-all cursor-pointer text-center"
                    >
                        TRY ANOTHER CODE
                    </button>
                    <button
                        onClick={onBackToHome}
                        className="w-full bg-white text-on-surface font-headline-lg-mobile text-sm uppercase rounded-lg py-3 border-3 border-on-background hard-shadow hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1c1b1b] transition-all cursor-pointer text-center"
                    >
                        BACK TO HOME
                    </button>
                </div>
            </div>

            {/* Fun Fact/Motivational Footer for Error State */}
            <p className="mt-8 font-label-bold text-label-bold text-primary uppercase text-center max-w-[220px] select-none tracking-wider text-xs border-b-2 border-primary/20 pb-1">
                Every juice is a fresh chance to win!
            </p>
        </div>
    );
}
