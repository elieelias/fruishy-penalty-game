'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COUNTRY_THEMES,
  CountryId,
  getCountryTheme,
} from '../data/countries';

type LaneKind = 'grass' | 'road' | 'river' | 'rail';
type PowerUpType = 'double' | 'ghost' | 'slow';
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type LaneMover = {
  x: number;
  visualX: number;
  teamIndex: number;
  width: number;
  impact: number;
  impactDirection: 1 | -1;
};

type Lane = {
  id: number;
  y: number;
  kind: LaneKind;
  direction: 1 | -1;
  speed: number;
  cars: LaneMover[];
  trees: number[];
  powerUp: { x: number; type: PowerUpType } | null;
  warningPlayed: boolean;
};

const LANE_HEIGHT = 72;
const COLUMN_COUNT = 5;
const FLAG_BLOCK_RADIUS = 34;
const RAFT_EDGE_PADDING = 18;

function PowerUpIcon({ type }: { type: PowerUpType }) {
  if (type === 'double') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <circle cx="8.5" cy="12.5" r="6.5" fill="currentColor" stroke="white" strokeWidth="1.5" />
        <circle cx="15.5" cy="10" r="6.5" fill="currentColor" stroke="white" strokeWidth="1.5" />
        <path d="m15.5 6.5 2.4 1.7-.9 2.8h-3l-.9-2.8 2.4-1.7ZM8.5 10l2.2 1.6-.8 2.6H7.1l-.8-2.6L8.5 10Z" fill="#17202a" />
      </svg>
    );
  }

  if (type === 'ghost') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M12 2 20 5v6c0 5.1-3.3 9.1-8 11-4.7-1.9-8-5.9-8-11V5l8-3Z" fill="currentColor" />
        <path d="m8.2 12 2.3 2.3 5.3-5.3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="13" r="8" fill="currentColor" stroke="white" strokeWidth="1.5" />
      <path d="M9 2h6M12 5V2m5.7 5.3 1.8-1.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 9v4l-3 2" fill="none" stroke="#17202a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChickenRoadGame({
  country,
  onGameFinished,
}: {
  country: CountryId;
  onGameFinished: (score: number) => void;
}) {
  const countryTheme = getCountryTheme(country);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameFinishedRef = useRef(onGameFinished);
  const [score, setScore] = useState(0);
  const [lanesPassed, setLanesPassed] = useState(0);
  const [dead, setDead] = useState(false);
  const [muted, setMuted] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [powerUpSeconds, setPowerUpSeconds] = useState<Record<PowerUpType, number>>({
    double: 0,
    ghost: 0,
    slow: 0,
  });
  const powerUpSecondsRef = useRef<Record<PowerUpType, number>>({
    double: 0,
    ghost: 0,
    slow: 0,
  });
  const [combo, setCombo] = useState(0);
  const nearMissCooldownRef = useRef(0);
  const activePowerUpsRef = useRef<PowerUpType[]>([]);
  const mutedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const crowdSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const crowdGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);
  const scoreRef = useRef(0);
  const lanesPassedRef = useRef(0);
  const startedAtRef = useRef(0);
  const roadTimeRef = useRef(0);
  const hazardRewardRef = useRef({ laneId: -1, seconds: 0, eligible: false });
  const visitedLaneIdsRef = useRef<Set<number>>(new Set());
  const nearMissRewardedLaneIdsRef = useRef<Set<number>>(new Set());
  const bonusScoreRef = useRef(0);
  const lastBaseScoreRef = useRef(0);
  const powerUpUntilRef = useRef<Record<PowerUpType, number>>({
    double: 0,
    ghost: 0,
    slow: 0,
  });
  const sectionRef = useRef<{
    kind: LaneKind;
    remaining: number;
    previous: LaneKind;
  }>({ kind: 'grass', remaining: 1, previous: 'grass' });
  const deadRef = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const moveLocked = useRef(false);
  const game = useRef({
    width: 0,
    height: 0,
    lanes: [] as Lane[],
    playerColumn: 2,
    playerX: 0,
    playerY: 0,
    targetX: 0,
    targetY: 0,
    cameraY: 0,
    targetCameraY: 0,
    hop: 0,
    hopFoot: 1,
    landingSquash: 0,
    hitStop: 0,
    impactFlash: 0,
    nextLaneId: 0,
    currentStep: 0,
    maxStep: 0,
    lastForwardAt: 0,
    combo: 0,
    particles: [] as Particle[],
    shake: 0,
  });

  useEffect(() => {
    gameFinishedRef.current = onGameFinished;
  }, [onGameFinished]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playHop = useCallback((safeLanding: boolean) => {
    if (mutedRef.current) return;
    const audio = getAudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = safeLanding ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(
      safeLanding ? 520 : 260,
      audio.currentTime
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      safeLanding ? 760 : 390,
      audio.currentTime + 0.09
    );
    gain.gain.setValueAtTime(0.16, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.13);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.14);
  }, [getAudioContext]);

  const playCrash = useCallback(() => {
    if (mutedRef.current || !audioContextRef.current) return;
    const audio = audioContextRef.current;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(38, audio.currentTime + 0.32);
    gain.gain.setValueAtTime(0.28, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.34);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.35);
  }, []);

  const playAlert = useCallback(() => {
    if (mutedRef.current) return;
    const audio = getAudioContext();
    for (const offset of [0, 0.13]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = 720;
      gain.gain.setValueAtTime(0.075, audio.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + offset + 0.09
      );
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(audio.currentTime + offset);
      oscillator.stop(audio.currentTime + offset + 0.1);
    }
  }, [getAudioContext]);

  const playWhistle = useCallback(() => {
    if (mutedRef.current) return;
    const audio = getAudioContext();
    for (const offset of [0, 0.09]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1850, audio.currentTime + offset);
      oscillator.frequency.linearRampToValueAtTime(
        2250,
        audio.currentTime + offset + 0.11
      );
      gain.gain.setValueAtTime(0.075, audio.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + offset + 0.13
      );
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(audio.currentTime + offset);
      oscillator.stop(audio.currentTime + offset + 0.14);
    }
  }, [getAudioContext]);

  const playCheer = useCallback(() => {
    if (mutedRef.current) return;
    const audio = getAudioContext();
    const length = Math.floor(audio.sampleRate * 0.55);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const envelope = Math.sin((index / length) * Math.PI);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 950;
    filter.Q.value = 0.55;
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.55);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  }, [getAudioContext]);

  const startMusic = useCallback(() => {
    if (musicTimerRef.current !== null) return;
    const crowdAudio = getAudioContext();
    if (!crowdSourceRef.current) {
      const crowdLength = crowdAudio.sampleRate * 2;
      const crowdBuffer = crowdAudio.createBuffer(
        1,
        crowdLength,
        crowdAudio.sampleRate
      );
      const crowdData = crowdBuffer.getChannelData(0);
      for (let index = 0; index < crowdLength; index += 1) {
        crowdData[index] =
          (Math.random() * 2 - 1) *
          (0.65 + Math.sin((index / crowdLength) * Math.PI * 12) * 0.12);
      }
      const crowdSource = crowdAudio.createBufferSource();
      const crowdFilter = crowdAudio.createBiquadFilter();
      const crowdGain = crowdAudio.createGain();
      crowdSource.buffer = crowdBuffer;
      crowdSource.loop = true;
      crowdFilter.type = 'lowpass';
      crowdFilter.frequency.value = 720;
      crowdGain.gain.value = mutedRef.current ? 0 : 0.014;
      crowdSource.connect(crowdFilter);
      crowdFilter.connect(crowdGain);
      crowdGain.connect(crowdAudio.destination);
      crowdSource.start();
      crowdSourceRef.current = crowdSource;
      crowdGainRef.current = crowdGain;
    }
    const melody = [
      262, 330, 392, 523, 392, 330, 294, 349,
      440, 587, 440, 349, 330, 392, 494, 392,
    ];
    const bass = [131, 147, 175, 165];

    const playMusicNote = () => {
      if (mutedRef.current) return;
      const audio = getAudioContext();
      const step = musicStepRef.current;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = melody[step % melody.length];
      musicStepRef.current += 1;
      gain.gain.setValueAtTime(step % 4 === 0 ? 0.045 : 0.028, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.21);

      if (step % 4 === 0) {
        const bassOscillator = audio.createOscillator();
        const bassGain = audio.createGain();
        bassOscillator.type = 'square';
        bassOscillator.frequency.value = bass[(step / 4) % bass.length];
        bassGain.gain.setValueAtTime(0.025, audio.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(
          0.001,
          audio.currentTime + 0.34
        );
        bassOscillator.connect(bassGain);
        bassGain.connect(audio.destination);
        bassOscillator.start();
        bassOscillator.stop(audio.currentTime + 0.35);
      }

      if (step % 2 === 0) {
        const beat = audio.createOscillator();
        const beatGain = audio.createGain();
        beat.type = 'sine';
        beat.frequency.setValueAtTime(95, audio.currentTime);
        beat.frequency.exponentialRampToValueAtTime(48, audio.currentTime + 0.07);
        beatGain.gain.setValueAtTime(0.035, audio.currentTime);
        beatGain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);
        beat.connect(beatGain);
        beatGain.connect(audio.destination);
        beat.start();
        beat.stop(audio.currentTime + 0.09);
      }
    };

    playMusicNote();
    musicTimerRef.current = window.setInterval(playMusicNote, 230);
  }, [getAudioContext]);

  useEffect(() => {
    return () => {
      if (musicTimerRef.current !== null) {
        window.clearInterval(musicTimerRef.current);
      }
      crowdSourceRef.current?.stop();
      void audioContextRef.current?.close();
    };
  }, []);

  const columnX = useCallback((column: number, width: number) => {
    const playableWidth = Math.min(width - 36, 520);
    const left = (width - playableWidth) / 2;
    return left + (column + 0.5) * (playableWidth / COLUMN_COUNT);
  }, []);

  const columnStep = useCallback((width: number) => {
    const playableWidth = Math.min(width - 36, 520);
    return playableWidth / COLUMN_COUNT;
  }, []);

  const nearestColumn = useCallback((x: number, width: number) => {
    let closestColumn = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let column = 0; column < COLUMN_COUNT; column += 1) {
      const distance = Math.abs(columnX(column, width) - x);
      if (distance < closestDistance) {
        closestColumn = column;
        closestDistance = distance;
      }
    }
    return closestColumn;
  }, [columnX]);

  const makeLane = useCallback((id: number, y: number, width: number): Lane => {
    const progress = lanesPassedRef.current;
    const section = sectionRef.current;
    if (section.remaining <= 0) {
      const choices: LaneKind[] =
        id < 7
          ? ['grass', 'road', 'road']
          : id < 12
            ? ['grass', 'road', 'road', 'river']
            : ['grass', 'road', 'road', 'river', 'rail'];
      const available = choices.filter((choice) => choice !== section.previous);
      section.kind = available[Math.floor(Math.random() * available.length)];
      section.previous = section.kind;
      if (section.kind === 'road') {
        section.remaining = 1 + Math.floor(Math.random() * 3);
      } else if (section.kind === 'river') {
        const riverSizeRoll = Math.random();
        section.remaining =
          riverSizeRoll < 0.28
            ? 1
            : riverSizeRoll < 0.56
              ? 2
              : riverSizeRoll < 0.78
                ? 3
                : riverSizeRoll < 0.94
                  ? 4
                  : 5;
      } else if (section.kind === 'grass') {
        section.remaining = 1 + Math.floor(Math.random() * 2);
      } else {
        section.remaining = 1;
      }
    }
    const kind = id === 0 ? 'grass' : section.kind;
    section.remaining -= 1;
    const direction: 1 | -1 = id % 2 === 0 ? 1 : -1;
    const difficulty = Math.min(2.35, 0.78 + progress * 0.038);
    const carCount =
      progress < 5
        ? 1
        : progress < 12
          ? 2
          : Math.max(3, Math.ceil(width / 250));
    const moverCount =
      kind === 'rail'
        ? 1
        : kind === 'river'
          ? 1 + Math.floor(Math.random() * 3)
          : carCount;
    const cars = kind !== 'grass'
      ? Array.from({ length: moverCount }, (_, index) => {
        const x =
          ((index + Math.random() * 0.45) * 300) % (width + 220) - 110;
        return {
          x,
          visualX: x,
          teamIndex: (id + index) % COUNTRY_THEMES.length,
          impact: 0,
          impactDirection: direction,
          width:
            kind === 'rail'
              ? 250
              : kind === 'river'
                ? 105 + Math.floor(Math.random() * 90)
                : 66 + ((id + index) % 3) * 12,
        };
      })
      : [];
    const trees: number[] = [];
    if (kind === 'grass') {
      const maxFlags = Math.min(2, Math.max(1, Math.floor(1 + progress / 18)));
      const treeCount = 1 + Math.floor(Math.random() * maxFlags);
      const blockedColumns: number[] = [];
      let attempts = 0;
      while (blockedColumns.length < treeCount && attempts < 30) {
        const column = Math.floor(Math.random() * COLUMN_COUNT);
        const touchesAnotherFlag = blockedColumns.some(
          (blockedColumn) => Math.abs(blockedColumn - column) <= 1
        );
        const blocksStartingSpot = id === 0 && column === 2;
        if (!touchesAnotherFlag && !blocksStartingSpot) {
          blockedColumns.push(column);
        }
        attempts += 1;
      }
      trees.push(...blockedColumns.map((column) => columnX(column, width)));
    }
    const availablePowerColumns = Array.from(
      { length: COLUMN_COUNT },
      (_, column) => columnX(column, width)
    ).filter((x) => trees.every((treeX) => Math.abs(treeX - x) > 36));
    const powerTypes: PowerUpType[] = ['double', 'ghost', 'slow'];
    const canSpawnPowerUp =
      id > 3 &&
      (kind === 'grass' || kind === 'road') &&
      availablePowerColumns.length > 0 &&
      Math.random() < Math.min(0.2, 0.11 + progress * 0.002);
    const powerUp = canSpawnPowerUp
      ? {
        x: availablePowerColumns[
          Math.floor(Math.random() * availablePowerColumns.length)
        ],
        type: powerTypes[Math.floor(Math.random() * powerTypes.length)],
      }
      : null;

    return {
      id,
      y,
      kind,
      direction,
      speed:
        kind === 'rail'
          ? 330 * difficulty
          : kind === 'river'
            ? (42 + (id % 3) * 7) * difficulty
            : (78 + (id % 5) * 11) * difficulty,
      cars,
      trees,
      powerUp,
      warningPlayed: false,
    };
  }, [columnX]);

  const initialiseGame = useCallback((width: number, height: number) => {
    const state = game.current;
    state.width = width;
    state.height = height;
    state.playerColumn = 2;
    state.playerX = columnX(2, width);
    state.targetX = state.playerX;
    state.playerY = height - LANE_HEIGHT * 0.5;
    state.targetY = state.playerY;
    state.cameraY = 0;
    state.targetCameraY = 0;
    state.hop = 0;
    state.hopFoot = 1;
    state.landingSquash = 0;
    state.hitStop = 0;
    state.impactFlash = 0;
    state.currentStep = 0;
    state.maxStep = 0;
    state.lastForwardAt = 0;
    state.combo = 0;
    state.particles = [];
    state.shake = 0;
    hazardRewardRef.current = { laneId: -1, seconds: 0, eligible: false };
    visitedLaneIdsRef.current.clear();
    nearMissRewardedLaneIdsRef.current.clear();
    sectionRef.current = {
      kind: 'grass',
      remaining: 1,
      previous: 'grass',
    };

    const laneCount = Math.ceil(height / LANE_HEIGHT) + 4;
    state.lanes = [];
    for (let index = 0; index < laneCount; index += 1) {
      const id = index;
      const y = height - LANE_HEIGHT * (index + 0.5);
      state.lanes.push(makeLane(id, y, width));
    }
    state.nextLaneId = laneCount;
  }, [columnX, makeLane]);

  const move = useCallback((direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (deadRef.current || moveLocked.current) return;
    const state = game.current;
    startMusic();
    if (startedAtRef.current === 0) {
      startedAtRef.current = performance.now();
      playWhistle();
    }
    moveLocked.current = true;
    window.setTimeout(() => {
      moveLocked.current = false;
    }, 105);
    const hasTreeAt = (x: number, y: number) =>
      state.lanes.some(
        (lane) =>
          lane.kind === 'grass' &&
          Math.abs(lane.y - y) < LANE_HEIGHT * 0.42 &&
          lane.trees.some((treeX) => Math.abs(treeX - x) < FLAG_BLOCK_RADIUS)
      );
    const startHop = () => {
      state.hop = 1;
      state.hopFoot *= -1;
    };

    if (direction === 'left') {
      const leftBoundary = columnX(0, state.width);
      const nextX = Math.max(leftBoundary, state.targetX - columnStep(state.width));
      if (hasTreeAt(nextX, state.targetY)) return;
      state.playerColumn = nearestColumn(nextX, state.width);
      state.targetX = nextX;
      startHop();
      playHop(false);
    } else if (direction === 'right') {
      const rightBoundary = columnX(COLUMN_COUNT - 1, state.width);
      const nextX = Math.min(rightBoundary, state.targetX + columnStep(state.width));
      if (hasTreeAt(nextX, state.targetY)) return;
      state.playerColumn = nearestColumn(nextX, state.width);
      state.targetX = nextX;
      startHop();
      playHop(false);
    } else if (direction === 'backward') {
      if (state.targetY < state.height - LANE_HEIGHT * 0.55) {
        if (hasTreeAt(state.targetX, state.targetY + LANE_HEIGHT)) return;
        state.currentStep = Math.max(0, state.currentStep - 1);
        state.targetY += LANE_HEIGHT;
        startHop();
        state.combo = 0;
        setCombo(0);
        playHop(false);
      }
    } else {
      if (hasTreeAt(state.targetX, state.targetY - LANE_HEIGHT)) return;
      state.currentStep += 1;
      if (state.currentStep > state.maxStep) {
        state.maxStep = state.currentStep;
        lanesPassedRef.current = state.maxStep;
        setLanesPassed(state.maxStep);
        const now = performance.now();
        const hopGap =
          state.lastForwardAt === 0 ? 1.4 : (now - state.lastForwardAt) / 1000;
        state.combo = hopGap <= 1.25 ? state.combo + 1 : 1;
        state.lastForwardAt = now;
        const speedBonus = Math.max(0, Math.round((1.4 - hopGap) * 45));
        bonusScoreRef.current += speedBonus + Math.min(50, state.combo * 4);
        setCombo(state.combo);
        if (state.combo > 0 && state.combo % 5 === 0) {
          playCheer();
          const confettiColors = [
            countryTheme.primary,
            countryTheme.secondary,
            countryTheme.accent,
            '#ffffff',
            '#ffd21c',
          ];
          for (let index = 0; index < 28; index += 1) {
            state.particles.push({
              x: state.playerX + (Math.random() - 0.5) * 70,
              y: state.playerY - 34,
              vx: (Math.random() - 0.5) * 170,
              vy: -55 - Math.random() * 120,
              life: 0.9 + Math.random() * 0.5,
              color: confettiColors[index % confettiColors.length],
              size: 3 + Math.random() * 5,
            });
          }
        }
      }
      state.targetY -= LANE_HEIGHT;
      startHop();
      for (let index = 0; index < 5; index += 1) {
        state.particles.push({
          x: state.playerX,
          y: state.playerY + 18,
          vx: (Math.random() - 0.5) * 45,
          vy: 18 + Math.random() * 24,
          life: 0.45,
          color: '#d7f7a8',
          size: 3 + Math.random() * 3,
        });
      }

      if (state.targetY + state.targetCameraY < state.height * 0.38) {
        state.targetCameraY += LANE_HEIGHT;
        const topY = Math.min(...state.lanes.map((lane) => lane.y));
        state.lanes.push(
          makeLane(state.nextLaneId, topY - LANE_HEIGHT, state.width)
        );
        state.nextLaneId += 1;
        state.lanes = state.lanes.filter(
          (lane) =>
            lane.y + state.targetCameraY < state.height + LANE_HEIGHT
        );
      }

      const landingLane = state.lanes.reduce<Lane | null>((closest, lane) => {
        if (!closest) return lane;
        return Math.abs(lane.y - state.targetY) <
          Math.abs(closest.y - state.targetY)
          ? lane
          : closest;
      }, null);
      playHop(landingLane?.kind === 'grass');
    }
  }, [
    columnX,
    columnStep,
    countryTheme.accent,
    countryTheme.primary,
    countryTheme.secondary,
    makeLane,
    nearestColumn,
    playCheer,
    playHop,
    playWhistle,
    startMusic,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') move('left');
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') move('right');
      if (
        event.key === 'ArrowUp' ||
        event.key === ' ' ||
        event.key.toLowerCase() === 'w'
      ) {
        event.preventDefault();
        move('forward');
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        move('backward');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let previousTime = performance.now();

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      initialiseGame(width, height);
    };

    const roundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
    };

    const finishGame = (hitMover?: LaneMover) => {
      if (deadRef.current) return;
      deadRef.current = true;
      game.current.hitStop = 0.1;
      game.current.shake = 22;
      game.current.impactFlash = 1;
      if (hitMover) {
        hitMover.impact = 1;
        hitMover.impactDirection =
          game.current.playerX < hitMover.visualX + hitMover.width / 2 ? 1 : -1;
      }
      for (let index = 0; index < 38; index += 1) {
        const colorIndex = index % 3;
        game.current.particles.push({
          x: game.current.playerX,
          y: game.current.playerY,
          vx: (Math.random() - 0.5) * 270,
          vy: (Math.random() - 0.72) * 230,
          life: 0.9,
          color:
            colorIndex === 0
              ? '#ffffff'
              : colorIndex === 1
                ? '#ff4d45'
                : '#ffd21c',
          size: 4 + Math.random() * 8,
        });
      }
      setDead(true);
      playCrash();
      window.setTimeout(() => {
        gameFinishedRef.current(scoreRef.current);
      }, 900);
    };

    const activatePowerUp = (type: PowerUpType, time: number) => {
      const duration =
        type === 'double' ? 8000 : type === 'ghost' ? 6000 : 7000;
      powerUpUntilRef.current[type] = Math.max(
        powerUpUntilRef.current[type],
        time
      ) + duration;
      const color =
        type === 'double' ? '#ffd21c' : type === 'ghost' ? '#c084fc' : '#67e8f9';
      playCheer();
      const celebrationColors = [
        color,
        countryTheme.primary,
        countryTheme.secondary,
        countryTheme.accent,
        '#ffffff',
      ];
      for (let index = 0; index < 24; index += 1) {
        game.current.particles.push({
          x: game.current.playerX,
          y: game.current.playerY,
          vx: (Math.random() - 0.5) * 120,
          vy: -35 - Math.random() * 110,
          life: 0.65 + Math.random() * 0.45,
          color: celebrationColors[index % celebrationColors.length],
          size: 3 + Math.random() * 5,
        });
      }
    };

    const drawPickupIcon = (
      type: PowerUpType,
      x: number,
      y: number
    ) => {
      context.save();
      context.translate(x, y);
      context.shadowColor = 'rgba(0,0,0,0.4)';
      context.shadowBlur = 4;
      context.shadowOffsetY = 3;
      context.strokeStyle = '#ffffff';
      context.fillStyle =
        type === 'double'
          ? '#ffd21c'
          : type === 'ghost'
            ? '#a855f7'
            : '#22d3ee';
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      if (type === 'double') {
        for (const ball of [
          { x: -6, y: 3 },
          { x: 6, y: -3 },
        ]) {
          context.fillStyle = '#ffd21c';
          context.strokeStyle = '#ffffff';
          context.lineWidth = 2.5;
          context.beginPath();
          context.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          context.fillStyle = '#17202a';
          context.beginPath();
          context.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
          context.fill();
          for (let spot = 0; spot < 5; spot += 1) {
            const angle = (spot / 5) * Math.PI * 2;
            context.beginPath();
            context.arc(
              ball.x + Math.cos(angle) * 6.2,
              ball.y + Math.sin(angle) * 6.2,
              1.4,
              0,
              Math.PI * 2
            );
            context.fill();
          }
        }
      } else if (type === 'ghost') {
        context.beginPath();
        context.moveTo(0, -13);
        context.lineTo(11, -9);
        context.lineTo(11, 0);
        context.bezierCurveTo(11, 8, 6, 12, 0, 15);
        context.bezierCurveTo(-6, 12, -11, 8, -11, 0);
        context.lineTo(-11, -9);
        context.closePath();
        context.fill();
        context.stroke();
        context.shadowColor = 'transparent';
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2.4;
        context.beginPath();
        context.moveTo(-5, 1);
        context.lineTo(-1, 5);
        context.lineTo(6, -3);
        context.stroke();
      } else {
        context.fillStyle = '#22d3ee';
        context.strokeStyle = '#ffffff';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(0, 2, 11, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.strokeStyle = '#22d3ee';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-4, -12);
        context.lineTo(4, -12);
        context.moveTo(0, -12);
        context.lineTo(0, -9);
        context.moveTo(8, -8);
        context.lineTo(11, -11);
        context.stroke();
        context.strokeStyle = '#17202a';
        context.lineWidth = 2.2;
        context.beginPath();
        context.moveTo(0, -3);
        context.lineTo(0, 3);
        context.lineTo(-5, 6);
        context.stroke();
      }
      context.restore();
    };

    const render = (time: number) => {
      const rawDt = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;
      const state = game.current;
      const frozen = state.hitStop > 0;
      state.hitStop = Math.max(0, state.hitStop - rawDt);
      const dt = frozen ? 0 : rawDt;

      const movementEase = 1 - Math.exp(-14 * dt);
      const cameraEase = 1 - Math.exp(-9 * dt);
      state.playerX += (state.targetX - state.playerX) * movementEase;
      state.playerY += (state.targetY - state.playerY) * movementEase;
      state.cameraY +=
        (state.targetCameraY - state.cameraY) * cameraEase;
      const wasHopping = state.hop > 0;
      state.hop = Math.max(0, state.hop - dt * 4.6);
      if (wasHopping && state.hop === 0) {
        state.landingSquash = 1;
        for (let index = 0; index < 9; index += 1) {
          state.particles.push({
            x: state.playerX + (Math.random() - 0.5) * 24,
            y: state.playerY + 26,
            vx: (Math.random() - 0.5) * 95,
            vy: -18 - Math.random() * 32,
            life: 0.34,
            color: index % 2 === 0 ? '#f7f1cf' : '#b9d98a',
            size: 2 + Math.random() * 4,
          });
        }
      }
      state.landingSquash = Math.max(0, state.landingSquash - dt * 7.5);
      state.impactFlash = Math.max(0, state.impactFlash - rawDt * 4.8);

      if (!deadRef.current && startedAtRef.current > 0) {
        const currentLane = state.lanes.reduce<Lane | null>((closest, lane) => {
          if (!closest) return lane;
          return Math.abs(lane.y - state.playerY) <
            Math.abs(closest.y - state.playerY)
            ? lane
            : closest;
        }, null);
        const isInHazardLane =
          currentLane !== null &&
          currentLane.kind !== 'grass' &&
          Math.abs(currentLane.y - state.playerY) <= LANE_HEIGHT / 2;

        if (currentLane && currentLane.id !== hazardRewardRef.current.laneId) {
          const isFirstVisit = !visitedLaneIdsRef.current.has(currentLane.id);
          visitedLaneIdsRef.current.add(currentLane.id);
          hazardRewardRef.current = {
            laneId: currentLane.id,
            seconds: 0,
            eligible: isFirstVisit,
          };
        }
        if (
          isInHazardLane &&
          hazardRewardRef.current.eligible &&
          hazardRewardRef.current.seconds < 2
        ) {
          const rewardedTime = Math.min(
            dt,
            2 - hazardRewardRef.current.seconds
          );
          hazardRewardRef.current.seconds += rewardedTime;
          roadTimeRef.current += rewardedTime;
        }

        const baseScore =
          lanesPassedRef.current * 100 +
          Math.floor(roadTimeRef.current * 10) +
          bonusScoreRef.current;
        const earnedSinceLastFrame = baseScore - lastBaseScoreRef.current;
        if (earnedSinceLastFrame > 0) {
          const multiplier =
            time < powerUpUntilRef.current.double ? 2 : 1;
          scoreRef.current += earnedSinceLastFrame * multiplier;
          lastBaseScoreRef.current = baseScore;
          setScore(scoreRef.current);
        }
      }

      const activeNow = (['double', 'ghost', 'slow'] as PowerUpType[]).filter(
        (type) => time < powerUpUntilRef.current[type]
      );
      if (activeNow.join(',') !== activePowerUpsRef.current.join(',')) {
        activePowerUpsRef.current = activeNow;
        setActivePowerUps(activeNow);
      }
      const remainingSeconds: Record<PowerUpType, number> = {
        double: Math.max(0, Math.ceil((powerUpUntilRef.current.double - time) / 1000)),
        ghost: Math.max(0, Math.ceil((powerUpUntilRef.current.ghost - time) / 1000)),
        slow: Math.max(0, Math.ceil((powerUpUntilRef.current.slow - time) / 1000)),
      };
      if (
        remainingSeconds.double !== powerUpSecondsRef.current.double ||
        remainingSeconds.ghost !== powerUpSecondsRef.current.ghost ||
        remainingSeconds.slow !== powerUpSecondsRef.current.slow
      ) {
        powerUpSecondsRef.current = remainingSeconds;
        setPowerUpSeconds(remainingSeconds);
      }
      const ghostActive = time < powerUpUntilRef.current.ghost;
      const trafficSpeedMultiplier =
        time < powerUpUntilRef.current.slow ? 0.5 : 1;

      context.fillStyle = '#86d84d';
      context.fillRect(0, 0, state.width, state.height);
      context.save();
      if (state.shake > 0.1) {
        context.translate(
          (Math.random() - 0.5) * state.shake,
          (Math.random() - 0.5) * state.shake
        );
        state.shake *= Math.max(0, 1 - dt * 8);
      }
      context.translate(0, state.cameraY);

      for (const lane of state.lanes) {
        if (lane.kind === 'road') {
          const laneTop = lane.y - LANE_HEIGHT / 2;
          context.fillStyle = '#555b68';
          context.fillRect(0, laneTop, state.width, LANE_HEIGHT);

          // Each car travels through the center of a fixed-height lane between
          // two dashed white dividers, matching the reference road layout.
          context.strokeStyle = 'rgba(255,255,255,0.95)';
          context.lineWidth = 4;
          context.setLineDash([34, 20]);
          context.beginPath();
          context.moveTo(0, laneTop + 2);
          context.lineTo(state.width, laneTop + 2);
          context.moveTo(0, laneTop + LANE_HEIGHT - 2);
          context.lineTo(state.width, laneTop + LANE_HEIGHT - 2);
          context.stroke();
          context.setLineDash([]);
        } else if (lane.kind === 'river') {
          const laneTop = lane.y - LANE_HEIGHT / 2;
          context.fillStyle = '#27a8df';
          context.fillRect(0, laneTop, state.width, LANE_HEIGHT);
          context.strokeStyle = 'rgba(255,255,255,0.2)';
          context.lineWidth = 2;
          const waveOffset = (time * 0.025 * lane.direction) % 70;
          for (let x = -100 + waveOffset; x < state.width; x += 70) {
            context.beginPath();
            context.moveTo(x, lane.y - 18);
            context.lineTo(x + 28, lane.y - 18);
            context.stroke();
          }
          for (let bannerX = 0; bannerX < state.width; bannerX += 96) {
            const bannerTheme =
              COUNTRY_THEMES[
                (lane.id + Math.floor(bannerX / 96)) % COUNTRY_THEMES.length
              ];
            context.fillStyle = bannerTheme.primary;
            context.fillRect(bannerX, laneTop, 62, 6);
            context.fillStyle = bannerTheme.secondary;
            context.fillRect(bannerX + 62, laneTop, 20, 6);
            context.fillStyle = bannerTheme.accent;
            context.fillRect(bannerX + 82, laneTop, 14, 6);
          }
        } else if (lane.kind === 'rail') {
          const laneTop = lane.y - LANE_HEIGHT / 2;
          context.fillStyle = '#8b8174';
          context.fillRect(0, laneTop, state.width, LANE_HEIGHT);
          context.strokeStyle = '#27272a';
          context.lineWidth = 5;
          context.beginPath();
          context.moveTo(0, lane.y - 17);
          context.lineTo(state.width, lane.y - 17);
          context.moveTo(0, lane.y + 17);
          context.lineTo(state.width, lane.y + 17);
          context.stroke();
          context.fillStyle = '#5b4636';
          for (let x = 0; x < state.width; x += 30) {
            context.fillRect(x, lane.y - 27, 9, 54);
          }
          for (let bannerX = 0; bannerX < state.width; bannerX += 110) {
            const bannerTheme =
              COUNTRY_THEMES[
                (lane.id + Math.floor(bannerX / 110)) % COUNTRY_THEMES.length
              ];
            context.fillStyle = '#f8fafc';
            context.fillRect(bannerX + 4, laneTop + 2, 86, 11);
            context.fillStyle = bannerTheme.primary;
            context.fillRect(bannerX + 6, laneTop + 4, 48, 7);
            context.fillStyle = bannerTheme.secondary;
            context.fillRect(bannerX + 54, laneTop + 4, 18, 7);
            context.fillStyle = bannerTheme.accent;
            context.fillRect(bannerX + 72, laneTop + 4, 16, 7);
          }
          if (lane.warningPlayed) {
            const warningOn = Math.floor(time / 170) % 2 === 0;
            context.fillStyle = '#171717';
            context.fillRect(12, lane.y - 31, 48, 18);
            context.fillStyle = warningOn ? '#ff2d2d' : '#641515';
            context.beginPath();
            context.arc(25, lane.y - 22, 6, 0, Math.PI * 2);
            context.arc(47, lane.y - 22, 6, 0, Math.PI * 2);
            context.fill();
          }
        } else {
          const laneTop = lane.y - LANE_HEIGHT / 2;
          context.fillStyle = '#64bd45';
          context.fillRect(0, laneTop, state.width, LANE_HEIGHT);
          for (let stripeX = 0; stripeX < state.width; stripeX += 72) {
            context.fillStyle =
              Math.floor(stripeX / 72) % 2 === lane.id % 2
                ? 'rgba(255,255,255,0.055)'
                : 'rgba(16,95,39,0.055)';
            context.fillRect(stripeX, laneTop, 72, LANE_HEIGHT);
          }
          context.strokeStyle = 'rgba(255,255,255,0.42)';
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(0, laneTop + 2);
          context.lineTo(state.width, laneTop + 2);
          context.moveTo(0, laneTop + LANE_HEIGHT - 2);
          context.lineTo(state.width, laneTop + LANE_HEIGHT - 2);
          context.stroke();

          if (lane.id % 6 === 0) {
            context.strokeStyle = 'rgba(255,255,255,0.48)';
            context.beginPath();
            context.moveTo(state.width / 2, laneTop);
            context.lineTo(state.width / 2, laneTop + LANE_HEIGHT);
            context.stroke();
            context.beginPath();
            context.arc(state.width / 2, lane.y, 19, 0, Math.PI * 2);
            context.stroke();
            context.fillStyle = 'rgba(255,255,255,0.7)';
            context.beginPath();
            context.arc(state.width / 2, lane.y, 2.5, 0, Math.PI * 2);
            context.fill();
          }

          // Light tournament dressing: footballs and training cones.
          context.save();
          context.globalAlpha = 0.78;
          for (let item = 0; item < 3; item += 1) {
            const itemX =
              ((lane.id * 97 + item * 181 + 54) % (state.width + 80)) - 40;
            const itemY = lane.y + (item % 2 === 0 ? -16 : 17);
            if ((lane.id + item) % 3 === 0) {
              context.fillStyle = '#ff8a00';
              context.beginPath();
              context.moveTo(itemX, itemY - 7);
              context.lineTo(itemX - 6, itemY + 6);
              context.lineTo(itemX + 6, itemY + 6);
              context.closePath();
              context.fill();
              context.fillStyle = '#ffffff';
              context.fillRect(itemX - 4, itemY, 8, 2);
              context.fillStyle = 'rgba(25,30,30,0.24)';
              context.fillRect(itemX - 8, itemY + 6, 16, 3);
            } else {
              context.fillStyle = '#ffffff';
              context.strokeStyle = '#263238';
              context.lineWidth = 1.5;
              context.beginPath();
              context.arc(itemX, itemY, 7, 0, Math.PI * 2);
              context.fill();
              context.stroke();
              context.fillStyle = '#263238';
              context.beginPath();
              context.arc(itemX, itemY, 2.5, 0, Math.PI * 2);
              context.fill();
              for (let spot = 0; spot < 5; spot += 1) {
                const angle = (spot / 5) * Math.PI * 2;
                context.beginPath();
                context.arc(
                  itemX + Math.cos(angle) * 4.7,
                  itemY + Math.sin(angle) * 4.7,
                  1.2,
                  0,
                  Math.PI * 2
                );
                context.fill();
              }
            }
          }
          context.restore();

          for (const treeX of lane.trees) {
            const sway = Math.sin(time * 0.0018 + treeX * 0.04) * 1.8;
            const flagTheme =
              COUNTRY_THEMES[
                (lane.id + Math.floor(treeX / 40)) % COUNTRY_THEMES.length
              ];
            context.fillStyle = 'rgba(20,70,20,0.22)';
            context.fillRect(treeX - 16, lane.y + 17, 36, 8);
            context.fillStyle = '#e8e4da';
            context.fillRect(treeX - 3, lane.y - 24, 6, 45);
            context.fillStyle = flagTheme.primary;
            context.fillRect(treeX + 2 + sway, lane.y - 24, 30, 17);
            context.fillStyle = flagTheme.secondary;
            context.fillRect(treeX + 2 + sway, lane.y - 7, 30, 13);
            context.fillStyle = flagTheme.accent;
            context.fillRect(treeX + 2 + sway, lane.y + 3, 30, 3);
          }
        }

        if (lane.powerUp) {
          const pickupY = lane.y;
          drawPickupIcon(lane.powerUp.type, lane.powerUp.x, pickupY);

          if (
            Math.abs(state.playerY - pickupY) < 22 &&
            Math.abs(state.playerX - lane.powerUp.x) < 25
          ) {
            activatePowerUp(lane.powerUp.type, time);
            lane.powerUp = null;
          }
        }

        if (lane.kind !== 'grass') {
          let supportedByLog = false;
          for (const car of lane.cars) {
            if (!deadRef.current) {
              car.x +=
                lane.speed * trafficSpeedMultiplier * lane.direction * dt;
              if (lane.direction > 0 && car.x > state.width + 100) {
                car.x = -car.width - 120;
                car.visualX = car.x;
                lane.warningPlayed = false;
              }
              if (lane.direction < 0 && car.x < -car.width - 120) {
                car.x = state.width + 100;
                car.visualX = car.x;
                lane.warningPlayed = false;
              }
            }
            const vehicleEase =
              1 - Math.exp(-24 * Math.min(dt, 1 / 60));
            car.visualX += (car.x - car.visualX) * vehicleEase;
            car.impact = Math.max(0, car.impact - dt * 2.4);
            const carX = car.visualX;
            if (lane.kind === 'rail' && !lane.warningPlayed) {
              const approaching =
                lane.direction > 0
                  ? car.x < -20
                  : car.x > state.width + 20;
              if (approaching) {
                lane.warningPlayed = true;
                playAlert();
              }
            }

            const carY = lane.y - 23;
            if (lane.kind === 'river') {
              const raftTheme = COUNTRY_THEMES[car.teamIndex];
              context.fillStyle = 'rgba(0,0,0,0.18)';
              roundedRect(carX + 3, carY + 7, car.width, 38, 9);
              context.fill();
              context.fillStyle = raftTheme.primary;
              context.strokeStyle = '#ffffff';
              context.lineWidth = 2;
              roundedRect(carX, carY + 2, car.width, 34, 10);
              context.fill();
              context.stroke();
              context.fillStyle = raftTheme.secondary;
              roundedRect(carX + 7, carY + 8, car.width - 14, 20, 6);
              context.fill();
              context.fillStyle = raftTheme.accent;
              for (let seatX = carX + 22; seatX < carX + car.width - 14; seatX += 32) {
                context.fillStyle = '#fff8d6';
                context.strokeStyle = '#17202a';
                context.lineWidth = 2;
                context.beginPath();
                context.arc(seatX, carY + 18, 9, 0, Math.PI * 2);
                context.fill();
                context.stroke();
                context.fillStyle = raftTheme.accent;
                context.beginPath();
                context.arc(seatX, carY + 18, 4, 0, Math.PI * 2);
                context.fill();
              }
              context.strokeStyle = '#f8fafc';
              context.lineWidth = 2;
              context.beginPath();
              context.moveTo(carX + 12, carY + 8);
              context.lineTo(carX + 12, carY - 10);
              context.stroke();
              context.fillStyle = raftTheme.primary;
              context.fillRect(carX + 13, carY - 10, 18, 5);
              context.fillStyle = raftTheme.secondary;
              context.fillRect(carX + 13, carY - 5, 18, 5);
              context.fillStyle = raftTheme.accent;
              context.fillRect(carX + 13, carY, 18, 3);

              context.fillStyle = '#ffffff';
              context.strokeStyle = '#263238';
              context.lineWidth = 1;
              context.beginPath();
              context.arc(carX + car.width - 18, carY + 18, 6, 0, Math.PI * 2);
              context.fill();
              context.stroke();
              context.fillStyle = '#263238';
              context.beginPath();
              context.arc(carX + car.width - 18, carY + 18, 2.2, 0, Math.PI * 2);
              context.fill();

              const onThisLane = Math.abs(state.playerY - lane.y) < 17;
              const supportX = state.hop > 0 ? state.targetX : state.playerX;
              const onThisLog =
                supportX > carX - RAFT_EDGE_PADDING &&
                supportX < carX + car.width + RAFT_EDGE_PADDING;
              if (
                !deadRef.current &&
                onThisLane &&
                onThisLog &&
                !supportedByLog
              ) {
                supportedByLog = true;
                const carriedDistance =
                  lane.speed * trafficSpeedMultiplier * lane.direction * dt;
                state.playerX += carriedDistance;
                state.targetX += carriedDistance;
                state.playerColumn = nearestColumn(state.targetX, state.width);
                if (
                  !ghostActive &&
                  (state.playerX < -24 || state.playerX > state.width + 24)
                ) {
                  finishGame();
                }
              }
              continue;
            }

            context.save();
            const vehicleBob =
              lane.kind === 'rail' ? 0 : Math.sin(time * 0.008 + carX) * 1.5;
            const impactKick = Math.sin(car.impact * Math.PI) * 12;
            context.translate(
              carX + car.width / 2 + impactKick * car.impactDirection,
              lane.y + vehicleBob - car.impact * 3
            );
            context.rotate(car.impact * car.impactDirection * 0.13);
            context.scale(1 + car.impact * 0.06, 1 - car.impact * 0.05);
            context.scale(lane.direction, 1);

            context.fillStyle = 'rgba(20,25,35,0.28)';
            context.beginPath();
            context.ellipse(4, 18, car.width * 0.54, 13, 0, 0, Math.PI * 2);
            context.fill();

            if (lane.kind === 'rail') {
              const shuttleTheme = COUNTRY_THEMES[car.teamIndex];
              context.fillStyle = shuttleTheme.primary;
              context.strokeStyle = '#20242a';
              context.lineWidth = 2;
              roundedRect(-car.width / 2, -22, car.width, 44, 6);
              context.fill();
              context.stroke();
              context.fillStyle = shuttleTheme.secondary;
              context.fillRect(-car.width / 2 + 3, 7, car.width - 6, 10);
              context.fillStyle = shuttleTheme.accent;
              context.fillRect(-car.width / 2 + 3, 17, car.width - 6, 4);
              context.fillStyle = '#d9f7ff';
              for (
                let windowX = -car.width / 2 + 18;
                windowX < car.width / 2 - 20;
                windowX += 34
              ) {
                context.fillRect(windowX, -12, 22, 17);
              }
              context.fillStyle = 'rgba(255,255,255,0.2)';
              context.fillRect(-car.width / 2 + 4, -19, car.width - 8, 7);
              context.fillStyle = '#ffffff';
              context.font = '900 10px sans-serif';
              context.textAlign = 'center';
              context.textBaseline = 'middle';
              context.fillText('CUP EXPRESS', 0, 13);
              context.fillStyle = '#ffffff';
              context.beginPath();
              context.arc(car.width / 2 - 18, -2, 9, 0, Math.PI * 2);
              context.fill();
              context.fillStyle = '#20242a';
              context.beginPath();
              context.arc(car.width / 2 - 18, -2, 3, 0, Math.PI * 2);
              context.fill();
            } else {
              const vehicleTheme = COUNTRY_THEMES[car.teamIndex];
              context.fillStyle = vehicleTheme.primary;
              context.strokeStyle = '#20242a';
              context.lineWidth = 2;
              roundedRect(-car.width / 2, -13, car.width, 32, 7);
              context.fill();
              context.stroke();
              context.fillStyle = vehicleTheme.secondary;
              context.beginPath();
              context.moveTo(-car.width * 0.24, -13);
              context.lineTo(-car.width * 0.11, -27);
              context.lineTo(car.width * 0.2, -27);
              context.lineTo(car.width * 0.34, -13);
              context.closePath();
              context.fill();
              context.stroke();
              context.fillStyle = '#91ebf3';
              context.beginPath();
              context.moveTo(-car.width * 0.07, -23);
              context.lineTo(car.width * 0.06, -23);
              context.lineTo(car.width * 0.06, -14);
              context.lineTo(-car.width * 0.16, -14);
              context.closePath();
              context.fill();
              context.beginPath();
              context.moveTo(car.width * 0.1, -23);
              context.lineTo(car.width * 0.18, -23);
              context.lineTo(car.width * 0.29, -14);
              context.lineTo(car.width * 0.1, -14);
              context.closePath();
              context.fill();
              context.fillStyle = vehicleTheme.accent;
              context.fillRect(-car.width / 2 + 2, -7, car.width - 4, 7);

              // Supporter flag mounted above each tournament vehicle.
              context.strokeStyle = '#e8e6df';
              context.lineWidth = 2;
              context.beginPath();
              context.moveTo(-car.width * 0.29, -14);
              context.lineTo(-car.width * 0.29, -35);
              context.stroke();
              context.fillStyle = vehicleTheme.primary;
              context.fillRect(-car.width * 0.29, -35, 17, 5);
              context.fillStyle = vehicleTheme.secondary;
              context.fillRect(-car.width * 0.29, -30, 17, 5);
              context.fillStyle = vehicleTheme.accent;
              context.fillRect(-car.width * 0.29, -25, 17, 4);

              // Football decal on the door.
              const ballX = car.width * 0.18;
              context.fillStyle = '#ffffff';
              context.strokeStyle = '#20242a';
              context.lineWidth = 1.5;
              context.beginPath();
              context.arc(ballX, 5, 7, 0, Math.PI * 2);
              context.fill();
              context.stroke();
              context.fillStyle = '#20242a';
              context.beginPath();
              context.arc(ballX, 5, 2.5, 0, Math.PI * 2);
              context.fill();
              for (let spot = 0; spot < 5; spot += 1) {
                const angle = (spot / 5) * Math.PI * 2;
                context.beginPath();
                context.arc(
                  ballX + Math.cos(angle) * 4.8,
                  5 + Math.sin(angle) * 4.8,
                  1.1,
                  0,
                  Math.PI * 2
                );
                context.fill();
              }

              context.fillStyle = '#242428';
              context.beginPath();
              context.arc(-car.width / 2 + 16, 18, 9, 0, Math.PI * 2);
              context.arc(car.width / 2 - 16, 18, 9, 0, Math.PI * 2);
              context.fill();
              context.fillStyle = '#e8e6df';
              context.beginPath();
              context.arc(-car.width / 2 + 16, 18, 4, 0, Math.PI * 2);
              context.arc(car.width / 2 - 16, 18, 4, 0, Math.PI * 2);
              context.fill();
            }
            context.restore();

            const playerHalf = 17;
            const colliding =
              !deadRef.current &&
              !ghostActive &&
              state.playerX + playerHalf > carX &&
              state.playerX - playerHalf < carX + car.width &&
              state.playerY + playerHalf > carY &&
              state.playerY - playerHalf < carY + 44;
            if (colliding) {
              finishGame(car);
            } else if (
              !ghostActive &&
              Math.abs(state.playerY - lane.y) < 18 &&
              time > nearMissCooldownRef.current &&
              !nearMissRewardedLaneIdsRef.current.has(lane.id)
            ) {
              const horizontalGap =
                state.playerX < carX
                  ? carX - (state.playerX + playerHalf)
                  : state.playerX - playerHalf - (carX + car.width);
              if (horizontalGap >= 0 && horizontalGap < 13) {
                nearMissCooldownRef.current = time + 1200;
                nearMissRewardedLaneIdsRef.current.add(lane.id);
                bonusScoreRef.current += 25;
              }
            }
          }

          if (
            !deadRef.current &&
            !ghostActive &&
            lane.kind === 'river' &&
            Math.abs(state.playerY - lane.y) < 17 &&
            !supportedByLog
          ) {
            finishGame();
          }
        }
      }

      const hopPhase = state.hop > 0 ? 1 - state.hop : 1;
      const hopY = state.hop > 0 ? Math.sin(hopPhase * Math.PI) * 15 : 0;
      const launchSquash =
        state.hop > 0 && hopPhase < 0.16
          ? 1 - hopPhase / 0.16
          : 0;
      const squashAmount = Math.max(
        launchSquash * 0.15,
        state.landingSquash * 0.18
      );
      const footCycle =
        state.hop > 0
          ? Math.sin(hopPhase * Math.PI * 2) * 6 * state.hopFoot
          : 0;
      context.save();
      if (ghostActive) context.globalAlpha = 0.42;
      context.translate(state.playerX, state.playerY - hopY);

      context.fillStyle = 'rgba(0,0,0,0.2)';
      context.beginPath();
      context.ellipse(
        0,
        22 + hopY,
        22 - hopY * 0.28,
        8 - hopY * 0.12,
        0,
        0,
        Math.PI * 2
      );
      context.fill();
      context.save();
      if (deadRef.current) context.rotate(Math.PI / 2);
      context.scale(1 + squashAmount, 1 - squashAmount);
      // Single rounded cube chicken, matching the supplied reference.
      context.fillStyle = '#d98616';
      roundedRect(-16, 24 - Math.max(0, footCycle), 13, 7, 3);
      context.fill();
      roundedRect(5, 24 - Math.max(0, -footCycle), 15, 7, 3);
      context.fill();

      context.fillStyle = countryTheme.primary;
      roundedRect(-21, -25, 42, 51, 9);
      context.fill();
      context.fillStyle = countryTheme.secondary;
      roundedRect(14, -20, 7, 40, 4);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.72)';
      roundedRect(-17, -22, 29, 7, 4);
      context.fill();

      context.fillStyle = countryTheme.secondary;
      roundedRect(-25, -3, 7, 18, 3);
      context.fill();
      context.fillStyle = countryTheme.accent;
      roundedRect(18, -3, 7, 18, 3);
      context.fill();

      context.fillStyle = '#ef4c58';
      roundedRect(-6, -31, 15, 7, 3);
      context.fill();
      context.fillStyle = '#cf3543';
      context.fillRect(6, -28, 3, 4);

      // The player sees the chicken from behind as it faces up the road.
      context.fillStyle = countryTheme.secondary;
      roundedRect(-19, -2, 38, 9, 3);
      context.fill();
      context.fillStyle = countryTheme.accent;
      roundedRect(-19, 7, 38, 6, 2);
      context.fill();
      context.fillStyle = countryTheme.primary;
      roundedRect(-9, 9, 18, 11, 5);
      context.fill();
      context.fillStyle = '#dedcd5';
      roundedRect(-5, 15, 10, 7, 3);
      context.fill();
      context.restore();
      context.restore();

      state.particles = state.particles.filter((particle) => {
        particle.life -= dt;
        if (particle.life <= 0) return false;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 65 * dt;
        context.globalAlpha = Math.min(1, particle.life * 2);
        context.fillStyle = particle.color;
        context.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
        return true;
      });
      context.globalAlpha = 1;
      context.restore();

      if (state.impactFlash > 0) {
        context.fillStyle = `rgba(255,255,255,${state.impactFlash * 0.32})`;
        context.fillRect(0, 0, state.width, state.height);
        context.strokeStyle = `rgba(255,210,28,${state.impactFlash * 0.9})`;
        context.lineWidth = 5;
        context.beginPath();
        context.arc(
          state.playerX,
          state.playerY + state.cameraY,
          28 + (1 - state.impactFlash) * 44,
          0,
          Math.PI * 2
        );
        context.stroke();
      }

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [
    countryTheme.accent,
    countryTheme.primary,
    countryTheme.secondary,
    initialiseGame,
    nearestColumn,
    playAlert,
    playCheer,
    playCrash,
  ]);

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) {
      move(dx < 0 ? 'left' : 'right');
    } else if (dy > 34) {
      move('backward');
    } else {
      move('forward');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#80d34a] select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <button
        type="button"
        aria-label={muted ? 'Turn sound on' : 'Mute sound'}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={() => {
          mutedRef.current = !mutedRef.current;
          setMuted(mutedRef.current);
          if (crowdGainRef.current && audioContextRef.current) {
            crowdGainRef.current.gain.setTargetAtTime(
              mutedRef.current ? 0 : 0.014,
              audioContextRef.current.currentTime,
              0.05
            );
          }
        }}
        className="absolute right-4 top-5 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white/25 bg-black/65 text-2xl text-white shadow-xl backdrop-blur-md"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <div className="pointer-events-none absolute left-1/2 top-5 z-10 flex -translate-x-1/2 items-center gap-5 rounded-2xl border-2 border-white/25 bg-black/65 px-7 py-3 text-white shadow-xl backdrop-blur-md">
        <div className="text-center">
          <div className="text-[9px] font-black tracking-[0.2em] text-white/55">SCORE</div>
          <div className="text-3xl font-black leading-none text-[#9cff57]">{score}</div>
        </div>
        <div className="h-9 w-px bg-white/20" />
        <div className="text-center">
          <div className="text-[9px] font-black tracking-[0.2em] text-white/55">LANES</div>
          <div className="text-3xl font-black leading-none">{lanesPassed}</div>
        </div>
      </div>

      {activePowerUps.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-10 flex -translate-x-1/2 gap-2">
          {activePowerUps.map((powerUp) => (
            <div
              key={powerUp}
              className={`flex items-center gap-1 text-xs font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
                powerUp === 'double'
                  ? 'text-yellow-300'
                  : powerUp === 'ghost'
                    ? 'text-purple-300'
                    : 'text-cyan-300'
              }`}
            >
              <PowerUpIcon type={powerUp} />
              <span className="text-white">{powerUpSeconds[powerUp]}s</span>
            </div>
          ))}
        </div>
      )}

      {combo >= 2 && !dead && (
        <div className="pointer-events-none absolute left-5 top-6 z-10 -rotate-3 rounded-xl border-2 border-white bg-orange-500 px-3 py-2 text-md font-black text-white shadow-lg">
          {combo}× COMBO
        </div>
      )}

      {dead && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-950/25">
          <div className="-rotate-3 rounded-2xl border-4 border-white bg-red-500 px-8 py-4 text-5xl font-black italic text-white shadow-2xl">
            CRASH!
          </div>
        </div>
      )}

    </div>
  );
}
