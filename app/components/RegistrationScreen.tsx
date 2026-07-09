'use client'

import React, { useState } from "react";
import Image from "next/image";
import {
    COUNTRY_THEMES,
    CountryId,
    DEFAULT_COUNTRY,
} from "../data/countries";

import 'material-symbols/outlined.css';

interface RegistrationScreenProps {
    onRegister: (name: string, phone: string, country: CountryId) => Promise<void>;
}

const SPONSORS = [
    { name: "Saturdays", logo: "/sponsors/saturdays.svg" },
    { name: "Frozen Flame", logo: "/sponsors/frozenflame.svg" },
    { name: "Junkies", logo: "/sponsors/junkies.svg" },
    { name: "Nerdy Tech", logo: "/sponsors/nerdytech.svg" },
    { name: "The Buzz Bar", logo: "/sponsors/thebuzzbar.svg" },
    { name: "Woudin", logo: "/sponsors/woudin.svg" },
    { name: "Yasmina Park", logo: "/sponsors/yasminapark.svg" },
];

export default function RegistrationScreen({
    onRegister,
}: RegistrationScreenProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState<CountryId>(DEFAULT_COUNTRY);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setErrorMsg("Please enter your name!");
            return;
        }
        if (!phone.trim()) {
            setErrorMsg("Please enter your phone number!");
            return;
        }
        setIsSubmitting(true);
        try {
            await onRegister(name.trim(), phone.trim(), country);
        } catch (error) {
            setErrorMsg(
                error instanceof Error
                    ? error.message
                    : "We could not start the game. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="w-full max-w-[480px] flex flex-col items-center gap-4 relative z-20 px-4 py-4"
        >
            {/* Hero Logo with WIN BIG! sticker */}
            <div className="relative group animate-bounce-slow">
                <Image
                    alt="Fruishy Brand Logo"
                    className="w-30 h-30 md:w-30 md:h-30 object-contain rounded-full sticker-border hard-shadow bg-surface hover:scale-105 transition-transform duration-300"
                    height={120}
                    src="/logo.jpeg"
                    width={120}
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

                <form
                    className="flex flex-col gap-3.5 w-full"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSubmit();
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
                            autoComplete="name"
                            maxLength={40}
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
                            autoComplete="tel"
                            maxLength={24}
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

                    <div className="flex flex-col gap-1">
                        <label
                            className="font-label-bold text-on-surface uppercase pl-1 text-xs tracking-wider"
                            htmlFor="playerCountry"
                        >
                            CHOOSE YOUR TEAM
                        </label>
                        <div className="relative">
                            <select
                                className="h-12 w-full appearance-none rounded-lg border-2 border-on-background bg-surface-container-low px-3 pr-10 font-body-md font-bold text-on-surface outline-none transition-colors hard-shadow focus:border-secondary"
                                id="playerCountry"
                                value={country}
                                onChange={(event) => {
                                    setCountry(event.target.value as CountryId);
                                    setErrorMsg("");
                                }}
                            >
                                {COUNTRY_THEMES.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.flag} {team.name}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                                expand_more
                            </span>
                        </div>
                    </div>

                    <button
                        className="mt-2 w-full bg-primary-container text-on-primary-container font-headline-lg-mobile text-xl uppercase rounded-xl py-3.5 sticker-border hard-shadow hover:bg-primary-fixed hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1c1b1b] transition-all active:translate-y-1 active:shadow-none relative overflow-hidden group cursor-pointer"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isSubmitting ? "CHECKING CODE..." : "START GAME"}{" "}
                            <span className="material-symbols-outlined select-none text-xl">sports_score</span>
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </form>
            </div>

            <section className="w-full overflow-hidden rounded-xl sticker-border-3 bg-white py-3 hard-shadow">
                <div className="flex w-full justify-center px-4 pb-2">
                    <p className="font-label-bold text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
                        Sponsored By:
                    </p>
                </div>
                <div className="sponsor-marquee flex w-max items-center gap-3 px-3">
                    {[...SPONSORS, ...SPONSORS].map((sponsor, index) => (
                        <div
                            className="flex h-14 w-32 shrink-0 items-center justify-center rounded-lg border-2 border-on-background bg-surface-container-low px-2"
                            key={`${sponsor.name}-${index}`}
                        >
                            <Image
                                alt={`${sponsor.name} logo`}
                                className="h-auto max-h-10 w-full object-contain"
                                height={56}
                                src={sponsor.logo}
                                width={126}
                            />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
