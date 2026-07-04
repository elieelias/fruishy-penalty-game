'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

type Lane = {
  id: number;
  y: number;
  kind: LaneKind;
  direction: 1 | -1;
  speed: number;
  cars: Array<{ x: number; visualX: number; color: string; width: number }>;
  trees: number[];
  powerUp: { x: number; type: PowerUpType } | null;
  warningPlayed: boolean;
};

const LANE_HEIGHT = 72;
const COLUMN_COUNT = 5;
const CAR_COLORS = ['#ff5b45', '#ffb000', '#8b5cf6', '#10b981', '#38bdf8'];

export default function ChickenRoadGame({
  onGameFinished,
}: {
  onGameFinished: (score: number) => void;
}) {
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
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);
  const scoreRef = useRef(0);
  const lanesPassedRef = useRef(0);
  const startedAtRef = useRef(0);
  const roadTimeRef = useRef(0);
  const hazardRewardRef = useRef({ laneId: -1, seconds: 0 });
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

  const startMusic = useCallback(() => {
    if (musicTimerRef.current !== null) return;
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
      void audioContextRef.current?.close();
    };
  }, []);

  const columnX = useCallback((column: number, width: number) => {
    const playableWidth = Math.min(width - 36, 520);
    const left = (width - playableWidth) / 2;
    return left + (column + 0.5) * (playableWidth / COLUMN_COUNT);
  }, []);

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
            color: CAR_COLORS[(id + index) % CAR_COLORS.length],
            width:
              kind === 'rail'
                ? 250
                : kind === 'river'
                  ? 105 + Math.floor(Math.random() * 90)
                  : 66 + ((id + index) % 3) * 12,
          };
        })
      : [];
    const treeCount =
      kind === 'grass'
        ? 1 + Math.floor(Math.random() * Math.min(3, 1 + progress / 12))
        : 0;
    const trees: number[] = [];
    for (let treeIndex = 0; treeIndex < treeCount; treeIndex += 1) {
      let treeX = 28 + Math.random() * Math.max(1, width - 56);
      let attempts = 0;
      while (
        attempts < 12 &&
        (trees.some((existingX) => Math.abs(existingX - treeX) < 52) ||
          (id === 0 && Math.abs(treeX - columnX(2, width)) < 58))
      ) {
        treeX = 28 + Math.random() * Math.max(1, width - 56);
        attempts += 1;
      }
      trees.push(treeX);
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
    state.currentStep = 0;
    state.maxStep = 0;
    state.lastForwardAt = 0;
    state.combo = 0;
    state.particles = [];
    state.shake = 0;
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
    if (startedAtRef.current === 0) startedAtRef.current = performance.now();
    moveLocked.current = true;
    window.setTimeout(() => {
      moveLocked.current = false;
    }, 105);
    const hasTreeAt = (x: number, y: number) =>
      state.lanes.some(
        (lane) =>
          lane.kind === 'grass' &&
          Math.abs(lane.y - y) < LANE_HEIGHT * 0.42 &&
          lane.trees.some((treeX) => Math.abs(treeX - x) < 34)
      );

    if (direction === 'left') {
      const nextColumn = Math.max(0, state.playerColumn - 1);
      const nextX = columnX(nextColumn, state.width);
      if (hasTreeAt(nextX, state.targetY)) return;
      state.playerColumn = nextColumn;
      state.targetX = nextX;
    } else if (direction === 'right') {
      const nextColumn = Math.min(COLUMN_COUNT - 1, state.playerColumn + 1);
      const nextX = columnX(nextColumn, state.width);
      if (hasTreeAt(nextX, state.targetY)) return;
      state.playerColumn = nextColumn;
      state.targetX = nextX;
    } else if (direction === 'backward') {
      if (state.targetY < state.height - LANE_HEIGHT * 0.55) {
        if (hasTreeAt(state.targetX, state.targetY + LANE_HEIGHT)) return;
        state.currentStep = Math.max(0, state.currentStep - 1);
        state.targetY += LANE_HEIGHT;
        state.hop = 1;
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
      }
      state.targetY -= LANE_HEIGHT;
      state.hop = 1;
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
  }, [columnX, makeLane, playHop, startMusic]);

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

    const finishGame = () => {
      if (deadRef.current) return;
      deadRef.current = true;
      game.current.shake = 9;
      for (let index = 0; index < 22; index += 1) {
        game.current.particles.push({
          x: game.current.playerX,
          y: game.current.playerY,
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.7) * 150,
          life: 0.8,
          color: index % 2 === 0 ? '#ffffff' : '#ff5b45',
          size: 4 + Math.random() * 6,
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
      for (let index = 0; index < 16; index += 1) {
        game.current.particles.push({
          x: game.current.playerX,
          y: game.current.playerY,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          life: 0.65,
          color,
          size: 3 + Math.random() * 5,
        });
      }
    };

    const render = (time: number) => {
      const dt = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;
      const state = game.current;

      const movementEase = 1 - Math.exp(-14 * dt);
      const cameraEase = 1 - Math.exp(-9 * dt);
      state.playerX += (state.targetX - state.playerX) * movementEase;
      state.playerY += (state.targetY - state.playerY) * movementEase;
      state.cameraY +=
        (state.targetCameraY - state.cameraY) * cameraEase;
      state.hop = Math.max(0, state.hop - dt * 4.6);

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
          hazardRewardRef.current = { laneId: currentLane.id, seconds: 0 };
        }
        if (
          isInHazardLane &&
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
          context.fillStyle = '#27a8df';
          context.fillRect(0, lane.y - LANE_HEIGHT / 2, state.width, LANE_HEIGHT);
          context.strokeStyle = 'rgba(255,255,255,0.2)';
          context.lineWidth = 2;
          const waveOffset = (time * 0.025 * lane.direction) % 70;
          for (let x = -100 + waveOffset; x < state.width; x += 70) {
            context.beginPath();
            context.moveTo(x, lane.y - 18);
            context.lineTo(x + 28, lane.y - 18);
            context.stroke();
          }
        } else if (lane.kind === 'rail') {
          context.fillStyle = '#8b8174';
          context.fillRect(0, lane.y - LANE_HEIGHT / 2, state.width, LANE_HEIGHT);
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
          context.fillStyle = lane.id % 8 === 0 ? '#70c53f' : '#80d34a';
          context.fillRect(0, lane.y - LANE_HEIGHT / 2, state.width, LANE_HEIGHT);
          for (let x = 18; x < state.width; x += 58) {
            context.fillStyle = 'rgba(30,120,35,0.24)';
            context.beginPath();
            context.arc(x + (lane.id % 2) * 19, lane.y, 4, 0, Math.PI * 2);
            context.fill();
            if ((Math.round((x - 18) / 58) + lane.id) % 3 === 0) {
              context.fillStyle = lane.id % 2 === 0 ? '#ffe45c' : '#f8fafc';
              context.fillRect(x + 8, lane.y - 15, 4, 4);
              context.fillStyle = '#237b36';
              context.fillRect(x + 9, lane.y - 11, 2, 7);
            }
          }
          for (const treeX of lane.trees) {
            const sway = Math.sin(time * 0.0018 + treeX * 0.04) * 1.8;
            context.fillStyle = 'rgba(20,70,20,0.22)';
            context.fillRect(treeX - 13, lane.y + 13, 34, 10);
            context.fillStyle = '#704321';
            context.fillRect(treeX - 5, lane.y - 4, 10, 27);
            context.fillStyle = '#176b2b';
            context.fillRect(treeX - 20 + sway, lane.y - 29, 40, 34);
            context.fillStyle = '#2fa943';
            context.fillRect(treeX - 16 + sway, lane.y - 34, 34, 29);
            context.fillStyle = 'rgba(255,255,255,0.14)';
            context.fillRect(treeX - 12 + sway, lane.y - 30, 25, 6);
          }
        }

        if (lane.powerUp) {
          const pickupY = lane.y;
          const pickupColor =
            lane.powerUp.type === 'double'
              ? '#ffd21c'
              : lane.powerUp.type === 'ghost'
                ? '#c084fc'
                : '#67e8f9';
          context.fillStyle = 'rgba(0,0,0,0.22)';
          context.beginPath();
          context.ellipse(lane.powerUp.x + 3, pickupY + 15, 19, 7, 0, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = pickupColor;
          context.beginPath();
          context.arc(lane.powerUp.x, pickupY, 18, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = '#ffffff';
          context.lineWidth = 3;
          context.stroke();
          context.fillStyle = '#17202a';
          context.font = '900 12px sans-serif';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(
            lane.powerUp.type === 'double'
              ? '2X'
              : lane.powerUp.type === 'ghost'
                ? 'G'
                : 'S',
            lane.powerUp.x,
            pickupY + 1
          );

          if (
            Math.abs(state.playerY - pickupY) < 22 &&
            Math.abs(state.playerX - lane.powerUp.x) < 25
          ) {
            activatePowerUp(lane.powerUp.type, time);
            lane.powerUp = null;
          }
        }

        if (!deadRef.current && lane.kind !== 'grass') {
          let supportedByLog = false;
          for (const car of lane.cars) {
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
            const vehicleEase =
              1 - Math.exp(-24 * Math.min(dt, 1 / 60));
            car.visualX += (car.x - car.visualX) * vehicleEase;
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
              context.fillStyle = 'rgba(0,0,0,0.18)';
              roundedRect(carX + 3, carY + 7, car.width, 38, 9);
              context.fill();
              context.fillStyle = '#8b572f';
              roundedRect(carX, carY + 2, car.width, 34, 10);
              context.fill();
              context.fillStyle = '#b7793f';
              for (let ringX = carX + 18; ringX < carX + car.width; ringX += 38) {
                context.fillRect(ringX, carY + 5, 4, 28);
              }

              const onThisLane = Math.abs(state.playerY - lane.y) < 17;
              const onThisLog =
                state.playerX > carX - 10 &&
                state.playerX < carX + car.width + 10;
              if (onThisLane && onThisLog && !supportedByLog) {
                supportedByLog = true;
                const carriedDistance =
                  lane.speed * trafficSpeedMultiplier * lane.direction * dt;
                state.playerX += carriedDistance;
                state.targetX += carriedDistance;
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
            context.translate(carX + car.width / 2, lane.y + vehicleBob);
            context.scale(lane.direction, 1);

            context.fillStyle = 'rgba(20,25,35,0.28)';
            context.beginPath();
            context.ellipse(4, 18, car.width * 0.54, 13, 0, 0, Math.PI * 2);
            context.fill();

            if (lane.kind === 'rail') {
              context.fillStyle = '#7c3aed';
              roundedRect(-car.width / 2, -22, car.width, 44, 6);
              context.fill();
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
            } else {
              context.fillStyle = car.color;
              roundedRect(-car.width / 2, -13, car.width, 32, 7);
              context.fill();
              context.fillStyle = car.color;
              context.beginPath();
              context.moveTo(-car.width * 0.24, -13);
              context.lineTo(-car.width * 0.11, -27);
              context.lineTo(car.width * 0.2, -27);
              context.lineTo(car.width * 0.34, -13);
              context.closePath();
              context.fill();
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
              context.fillStyle = 'rgba(255,255,255,0.2)';
              context.fillRect(-car.width / 2 + 6, -8, car.width - 12, 6);
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
              !ghostActive &&
              state.playerX + playerHalf > carX &&
              state.playerX - playerHalf < carX + car.width &&
              state.playerY + playerHalf > carY &&
              state.playerY - playerHalf < carY + 44;
            if (colliding) {
              finishGame();
            } else if (
              !ghostActive &&
              Math.abs(state.playerY - lane.y) < 18 &&
              time > nearMissCooldownRef.current
            ) {
              const horizontalGap =
                state.playerX < carX
                  ? carX - (state.playerX + playerHalf)
                  : state.playerX - playerHalf - (carX + car.width);
              if (horizontalGap >= 0 && horizontalGap < 13) {
                nearMissCooldownRef.current = time + 1200;
                bonusScoreRef.current += 25;
              }
            }
          }

          if (
            !ghostActive &&
            lane.kind === 'river' &&
            Math.abs(state.playerY - lane.y) < 17 &&
            !supportedByLog
          ) {
            finishGame();
          }
        }
      }

      const hopY = Math.sin(state.hop * Math.PI) * 8;
      context.save();
      if (ghostActive) context.globalAlpha = 0.42;
      context.translate(state.playerX, state.playerY - hopY);
      if (deadRef.current) context.rotate(Math.PI / 2);

      context.fillStyle = 'rgba(0,0,0,0.2)';
      context.beginPath();
      context.ellipse(0, 22 + hopY, 22, 8, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f4f1df';
      context.fillRect(-16, -3, 32, 29);
      context.fillStyle = '#ffffff';
      context.fillRect(-14, -27, 28, 25);
      context.fillStyle = '#e7e1c9';
      context.fillRect(-16, 19, 32, 7);
      context.fillStyle = '#ef4444';
      context.fillRect(-8, -34, 7, 9);
      context.fillRect(1, -37, 7, 12);
      context.fillStyle = '#f59e0b';
      context.beginPath();
      context.moveTo(-7, -27);
      context.lineTo(7, -27);
      context.lineTo(0, -39);
      context.closePath();
      context.fill();
      context.fillStyle = '#111827';
      context.fillRect(-9, -21, 4, 4);
      context.fillRect(5, -21, 4, 4);
      context.fillStyle = '#e59a21';
      context.fillRect(-11, 26, 5, 8);
      context.fillRect(6, 26, 5, 8);
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

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [initialiseGame, playAlert, playCrash]);

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
              className={`rounded-full border-2 border-white px-3 py-1 text-xs font-black text-[#17202a] shadow-lg ${
                powerUp === 'double'
                  ? 'bg-yellow-300'
                  : powerUp === 'ghost'
                    ? 'bg-purple-300'
                    : 'bg-cyan-300'
              }`}
            >
              {powerUp === 'double'
                ? '2× SCORE'
                : powerUp === 'ghost'
                  ? 'GHOST'
                  : 'SLOW TRAFFIC'}{' '}
              {powerUpSeconds[powerUp]}s
            </div>
          ))}
        </div>
      )}

      {combo >= 2 && !dead && (
        <div className="pointer-events-none absolute left-5 top-6 z-10 -rotate-3 rounded-xl border-2 border-white bg-orange-500 px-3 py-2 text-lg font-black text-white shadow-lg">
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
