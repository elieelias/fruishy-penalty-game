'use client'

import React, { useState, useSyncExternalStore } from "react";

import 'material-symbols/outlined.css';

interface RegistrationScreenProps {
    onRegister: (name: string, phone: string) => void;
}

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function RegistrationScreen({
    onRegister,
}: RegistrationScreenProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const isInteractive = useSyncExternalStore(
        subscribeToHydration,
        getClientSnapshot,
        getServerSnapshot
    );

    const handleSubmit = () => {
        if (!isInteractive) return;
        if (!name.trim()) {
            setErrorMsg("Please enter your striker name!");
            return;
        }
        if (!phone.trim()) {
            setErrorMsg("Please enter your phone number to track scores!");
            return;
        }
        onRegister(name.trim(), phone.trim());
    };

    return (
        <div
            className="w-full max-w-[480px] flex flex-col items-center gap-4 relative z-20 px-4 py-4"
        >
            {/* Hero Logo with WIN BIG! sticker */}
            <div className="relative group animate-bounce-slow">
                <img
                    alt="Fruishy Brand Logo"
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 md:w-32 md:h-32 object-contain rounded-full sticker-border hard-shadow bg-surface hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8qqva8bwHQeRwjPMJdsa9TkOjxAfIMO5wdAa1X3Q3FvgY_mrvGOVd10-LGMOfL8uTKsB2CmFmk9h6Htk63cjkMMf2Extjg_ExclO-ZbOijg19-AFOZtdtG1HkZ8ItWawnXqgYj4bXvnTYdOcSCgAxrwgdPI_aI9U-8MpAAcIrLLB-QexO-NeNbDLwaqu6V5jnYTQicP3W2u5io0DyJ7c59CjsZb1dFVq5wIE2KmGsqFoclC7lSM3F147ke8hy2LxRfGFguY5B3gix"
                />
                <div className="absolute -top-2 -right-4 bg-secondary-container text-on-secondary-container font-label-bold px-3 py-1 rounded-full sticker-border hard-shadow transform rotate-12 text-xs">
                    WIN BIG!
                </div>
            </div>


            {/* Registration Card */}
            <div className="bg-surface w-full rounded-xl sticker-border hard-shadow p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary"></div>
                <h3 className="font-headline-lg-mobile text-on-surface text-center uppercase italic text-lg">
                    JOIN THE GAME
                </h3>

                <div
                    className="flex flex-col gap-3.5 w-full"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleSubmit();
                        }
                    }}
                >
                    {errorMsg && (
                        <div className="bg-error-container text-on-error-container border-2 border-error p-2 rounded-lg font-bold text-center text-xs">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label
                            className="font-label-bold text-on-surface uppercase pl-1 text-xs tracking-wider"
                            htmlFor="playerName"
                        >
                            ENTER YOUR NAME
                        </label>
                        <input
                            className="w-full bg-surface-container-low border-2 border-on-background rounded-lg p-3 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:border-secondary transition-colors hard-shadow h-12 outline-none"
                            id="playerName"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrorMsg("");
                            }}
                            placeholder="e.g. Champion Charlie"
                            type="text"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            className="font-label-bold text-on-surface uppercase pl-1 text-xs tracking-wider"
                            htmlFor="playerPhone"
                        >
                            PHONE NUMBER
                        </label>
                        <input
                            className="w-full bg-surface-container-low border-2 border-on-background rounded-lg p-3 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 focus:border-secondary transition-colors hard-shadow h-12 outline-none"
                            id="playerPhone"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setErrorMsg("");
                            }}
                            placeholder="000-000-0000"
                            type="tel"
                        />
                    </div>

                    <button
                        className="mt-2 w-full bg-primary-container text-on-primary-container font-headline-lg-mobile text-xl uppercase rounded-xl py-3.5 sticker-border hard-shadow hover:bg-primary-fixed hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1c1b1b] transition-all active:translate-y-1 active:shadow-none relative overflow-hidden group cursor-pointer"
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isInteractive}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isInteractive ? "START GAME" : "LOADING…"}{" "}
                            <span className="material-symbols-outlined select-none text-xl">sports_score</span>
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>
            </div>
        </div>
    );
}
