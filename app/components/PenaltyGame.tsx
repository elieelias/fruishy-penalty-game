'use client';

import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Line, useTexture, useAnimations, useFBX } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';

import { useGLTF } from '@react-three/drei';

const MODEL_PATHS = {
  ball: '/models/ball.glb',
  goal: '/models/goal.glb',
  goalkeeper: '/models/goalkeeper1.glb',
  seating: '/models/seating.glb',
} as const;

const GOALKEEPER_ANIMATION_PATHS = [
  '/models/goalkeeper-animations/Goalkeeper Idle-2.fbx',
  '/models/goalkeeper-animations/Goalkeeper Diving Save-4.fbx',
  '/models/goalkeeper-animations/Goalkeeper Diving Save-3.fbx',
  '/models/goalkeeper-animations/Goalkeeper Catch.fbx',
  '/models/goalkeeper-animations/Walk Strafe Left.fbx',
  '/models/goalkeeper-animations/Walk Strafe Right.fbx',
  '/models/goalkeeper-animations/Getting Up.fbx',
  '/models/goalkeeper-animations/Defeat Idle.fbx',
] as const;

export function preloadPenaltyGameAssets() {
  [MODEL_PATHS.ball, MODEL_PATHS.goal, MODEL_PATHS.goalkeeper].forEach((path) =>
    useGLTF.preload(path)
  );
  GOALKEEPER_ANIMATION_PATHS.forEach((path) => useFBX.preload(path));
  useTexture.preload('/grass.png');
}

// ─────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────
type GamePhase = 'aiming' | 'shooting' | 'result_goal' | 'result_save' | 'result_miss';

// ─────────────────────────────────────────────────────────────────
// Updated Constants for the New Stadium Model
// ─────────────────────────────────────────────────────────────────
const GOAL_WIDTH = 14;
const GOAL_HEIGHT = 4.8;
const MAX_KEEPER_X = GOAL_WIDTH / 2 - 1.4;

// Shifted backwards to match where the stadium mesh actually renders the netting
const GOAL_Z = -3.2;

// Placed perfectly on top of the stadium's grass penalty mark texture
const BALL_START_Z = 17.5;

const BASE_GK_SPEED = 5.2;
const GK_SCALE = 0.018;
const GOALKEEPER_Z = GOAL_Z + 0.45;
const BALL_RADIUS = 0.3;

function calculateAimTarget(
  start: { x: number; y: number },
  current: { x: number; y: number }
) {
  const dx = current.x - start.x;
  const dy = start.y - current.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 20 || dy <= 3) return null;

  const power = Math.min(distance / 220, 1.15);
  return {
    x: (dx / distance) * (GOAL_WIDTH * 0.72) * power,
    y: Math.max(
      0.25,
      (dy / distance) * (GOAL_HEIGHT * 1.35) * power
    ),
    distance,
  };
}

function calculateShotPower(distance: number, elapsedSeconds: number) {
  const swipeSpeed = distance / Math.max(0.04, elapsedSeconds);
  const speedPower = THREE.MathUtils.clamp((swipeSpeed - 180) / 1350, 0, 1);
  const distancePower = THREE.MathUtils.clamp((distance - 20) / 220, 0, 1);

  // Swipe velocity matters most, while a longer gesture adds some extra force.
  return THREE.MathUtils.clamp(
    0.12 + speedPower * 0.68 + distancePower * 0.2,
    0.12,
    1
  );
}

function getGoalkeeperAccuracy(shotsTaken: number) {
  // The opening gives the player room to learn aiming and power.
  const openingAccuracy = [0.25, 0.3, 0.36];
  if (shotsTaken < openingAccuracy.length) return openingAccuracy[shotsTaken];

  return Math.min(0.9, 0.42 + (shotsTaken - 3) * 0.12);
}

// ─────────────────────────────────────────────────────────────────
// Audio FX Synthesizer (Web Audio API)
// ─────────────────────────────────────────────────────────────────
class SoundFX {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() { }

  setMuted(m: boolean) {
    this.muted = m;
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playKick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Kick sound: deep low-frequency thump
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playWhistle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 2400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, this.ctx.currentTime);

    // Whistle vibrato modulation
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.frequency.value = 35;
    modGain.gain.value = 80;

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    mod.start();
    osc.start();

    mod.stop(this.ctx.currentTime + 0.3);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCheer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Crowd cheer synthesized from white noise
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.4);

    noise.start();
    noise.stop(this.ctx.currentTime + 1.4);
  }

  playGroan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Crowd groan (sigh) synthesized from low-passed noise
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gain = this.ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.1);

    noise.start();
    noise.stop(this.ctx.currentTime + 1.1);
  }
}

// ─────────────────────────────────────────────────────────────────
// Goalkeeper Component (With Skeletal Animation)
// ─────────────────────────────────────────────────────────────────
function Goalkeeper({
  phase,
  gkTargetX,
  ballTarget,
  difficultyLevel,
  shouldSave,
}: {
  phase: GamePhase;
  gkTargetX: number;
  ballTarget: { x: number; y: number };
  difficultyLevel: number;
  shouldSave: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoBodyRef = useRef<RapierRigidBody>(null);
  const leftHandBodyRef = useRef<RapierRigidBody>(null);
  const rightHandBodyRef = useRef<RapierRigidBody>(null);
  const bonePosition = useRef(new THREE.Vector3());
  const boneRotation = useRef(new THREE.Quaternion());
  const leftHandPosition = useRef(new THREE.Vector3());
  const rightHandPosition = useRef(new THREE.Vector3());
  const glb = useGLTF(MODEL_PATHS.goalkeeper);
  const idleFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[0]);
  const diveLeftFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[1]);
  const diveRightFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[2]);
  const catchFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[3]);
  const strafeLeftFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[4]);
  const strafeRightFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[5]);
  const getUpFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[6]);
  const defeatFbx = useFBX(GOALKEEPER_ANIMATION_PATHS[7]);

  // Use the loaded scene directly to preserve animation joint bindings
  const gkModel = glb.scene;
  const goalkeeperBones = useMemo(
    () => ({
      torso: gkModel.getObjectByName('mixamorigSpine1'),
      leftHand: gkModel.getObjectByName('mixamorigLeftHand'),
      rightHand: gkModel.getObjectByName('mixamorigRightHand'),
    }),
    [gkModel]
  );
  const clips = useMemo(() => {
    const prepareClip = (
      source: THREE.AnimationClip,
      name: string,
      removeHorizontalRootMotion = false
    ) => {
      const clip = source.clone();
      clip.name = name;

      if (removeHorizontalRootMotion) {
        const hipsPosition = clip.tracks.find(
          (track) => track.name === 'mixamorigHips.position'
        );
        if (hipsPosition) {
          const initialX = hipsPosition.values[0];
          const initialZ = hipsPosition.values[2];
          for (let index = 0; index < hipsPosition.values.length; index += 3) {
            hipsPosition.values[index] = initialX;
            hipsPosition.values[index + 2] = initialZ;
          }
        }
      }

      return clip;
    };

    return [
      prepareClip(idleFbx.animations[0], 'idle', true),
      prepareClip(diveLeftFbx.animations[0], 'diveLeft', true),
      prepareClip(diveRightFbx.animations[0], 'diveRight', true),
      prepareClip(catchFbx.animations[0], 'catch', true),
      prepareClip(strafeLeftFbx.animations[0], 'strafeLeft', true),
      prepareClip(strafeRightFbx.animations[0], 'strafeRight', true),
      prepareClip(getUpFbx.animations[0], 'getUp', true),
      prepareClip(defeatFbx.animations[0], 'defeat', true),
    ];
  }, [
    catchFbx,
    defeatFbx,
    diveLeftFbx,
    diveRightFbx,
    getUpFbx,
    idleFbx,
    strafeLeftFbx,
    strafeRightFbx,
  ]);
  const { actions } = useAnimations(clips, groupRef);

  const dynamicGkSpeed = useMemo(
    () => BASE_GK_SPEED + (difficultyLevel - 1) * 0.75,
    [difficultyLevel]
  );
  const state = useRef({
    x: 0,
    isDiving: false,
    isRecovering: false,
    diveDir: 0,
    diveT: 0,
    activeAnimation: '',
  });

  const playAnimation = useCallback((
    name: string,
    loop = true,
    timeScale = 1
  ) => {
    const nextAction = actions[name];
    if (!nextAction || state.current.activeAnimation === name) return;

    for (const action of Object.values(actions)) {
      if (action && action !== nextAction) action.fadeOut(0.16);
    }

    nextAction
      .reset()
      .setEffectiveTimeScale(timeScale)
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
      .fadeIn(0.16)
      .play();
    state.current.activeAnimation = name;
  }, [actions]);

  // Ensure shadow maps are enabled on the skinned mesh elements
  useEffect(() => {
    if (gkModel) {
      gkModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
          }
        }
      });

    }
  }, [gkModel]);

  useEffect(() => {
    if (phase !== 'result_save') return;

    const recoveryTimer = window.setTimeout(() => {
      state.current.isRecovering = true;
      playAnimation('getUp', false, 2.5);
    }, 850);

    return () => window.clearTimeout(recoveryTimer);
  }, [phase, playAnimation]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = state.current;
    let saveContactBlend = 0;

    if (phase === 'aiming') {
      const dx = gkTargetX - s.x;
      s.x += Math.sign(dx) * Math.min(Math.abs(dx), dynamicGkSpeed * delta);
      groupRef.current.position.x = s.x;

      groupRef.current.position.y = 0.05;
      groupRef.current.position.z = GOALKEEPER_Z;
      groupRef.current.rotation.set(0, 0, 0);

      s.isDiving = false;
      s.isRecovering = false;
      s.diveT = 0;

      playAnimation(
        Math.abs(dx) < 0.08 ? 'idle' : dx < 0 ? 'strafeLeft' : 'strafeRight'
      );
    } else if (phase === 'shooting' || phase === 'result_save') {
      if (!s.isDiving) {
        s.isDiving = true;
        s.diveDir = gkTargetX < 0 ? -1 : 1;
      }

      // Give the animation time to show a planted push-off and full extension.
      // Later levels react a little faster without turning the dive into a teleport.
      const diveSpeedFactor = Math.min(
        2.65,
        2.2 + (difficultyLevel - 1) * 0.075
      );
      s.diveT = Math.min(1, s.diveT + delta * diveSpeedFactor);
      const pushOffT = THREE.MathUtils.clamp((s.diveT - 0.06) / 0.94, 0, 1);
      const travelT = THREE.MathUtils.smoothstep(pushOffT, 0, 1);
      const flightArc = Math.sin(pushOffT * Math.PI);
      saveContactBlend = shouldSave
        ? THREE.MathUtils.smoothstep(pushOffT, 0.48, 0.92)
        : 0;

      const targetDiveX = gkTargetX;
      groupRef.current.position.x = THREE.MathUtils.lerp(s.x, targetDiveX, travelT);
      groupRef.current.position.y = 0.05 + flightArc * 0.16;
      groupRef.current.position.z = GOALKEEPER_Z + flightArc * 0.22;
      groupRef.current.rotation.set(0, 0, 0);

      if (s.isRecovering) {
        playAnimation('getUp', false, 2.5);
      } else if (Math.abs(ballTarget.x) < 1.35 && ballTarget.y < 3.4) {
        playAnimation('catch', false, 1);
      } else {
        playAnimation(s.diveDir < 0 ? 'diveLeft' : 'diveRight', false, 1);
      }
    } else if (phase === 'result_goal') {
      groupRef.current.position.y = 0.05;
      groupRef.current.rotation.set(0, 0, 0);
      playAnimation('defeat');
    } else {
      playAnimation('idle');
    }

    // On a correct read, finish the animation with the nearest glove at the
    // shot target. This ties increasing AI accuracy to visible ball contact.
    if (
      saveContactBlend > 0 &&
      goalkeeperBones.leftHand &&
      goalkeeperBones.rightHand
    ) {
      // Update only the two bones needed for interception. Traversing the
      // complete skinned model here caused visible frame drops during dives.
      goalkeeperBones.leftHand.getWorldPosition(leftHandPosition.current);
      goalkeeperBones.rightHand.getWorldPosition(rightHandPosition.current);

      const leftDistance = leftHandPosition.current.distanceTo(
        bonePosition.current.set(ballTarget.x, ballTarget.y, GOALKEEPER_Z)
      );
      const rightDistance = rightHandPosition.current.distanceTo(
        bonePosition.current.set(ballTarget.x, ballTarget.y, GOALKEEPER_Z)
      );
      const catchingHand =
        leftDistance <= rightDistance
          ? leftHandPosition.current
          : rightHandPosition.current;

      groupRef.current.position.x +=
        (ballTarget.x - catchingHand.x) * saveContactBlend;
      groupRef.current.position.y +=
        (ballTarget.y - catchingHand.y) * saveContactBlend;
    }

    // Keep the physical save zones attached to the animated skeleton. A save
    // can now only occur where the visible hands or torso actually are.
    const syncBoneCollider = (
      bone: THREE.Object3D | undefined,
      body: RapierRigidBody | null
    ) => {
      if (!bone || !body) return;
      bone.getWorldPosition(bonePosition.current);
      bone.getWorldQuaternion(boneRotation.current);
      body.setNextKinematicTranslation(bonePosition.current);
      body.setNextKinematicRotation(boneRotation.current);
    };

    syncBoneCollider(goalkeeperBones.torso, torsoBodyRef.current);
    syncBoneCollider(goalkeeperBones.leftHand, leftHandBodyRef.current);
    syncBoneCollider(goalkeeperBones.rightHand, rightHandBodyRef.current);
  });

  if (!gkModel) return null;

  return (
    <>
      <group ref={groupRef} position={[0, 0.05, GOALKEEPER_Z]}>
        <primitive object={gkModel} scale={GK_SCALE} rotation={[0, Math.PI, 0]} />
      </group>
      <RigidBody
        ref={torsoBodyRef}
        type="kinematicPosition"
        name="goalkeeper"
        colliders={false}
        position={[0, 1.35, GOALKEEPER_Z]}
      >
        <CuboidCollider args={[0.42, 0.58, 0.28]} friction={0.5} restitution={0.18} />
      </RigidBody>
      <RigidBody
        ref={leftHandBodyRef}
        type="kinematicPosition"
        name="goalkeeper"
        colliders={false}
        position={[-0.45, 1.6, GOALKEEPER_Z]}
      >
        <BallCollider args={[0.46]} friction={0.5} restitution={0.22} />
      </RigidBody>
      <RigidBody
        ref={rightHandBodyRef}
        type="kinematicPosition"
        name="goalkeeper"
        colliders={false}
        position={[0.45, 1.6, GOALKEEPER_Z]}
      >
        <BallCollider args={[0.46]} friction={0.5} restitution={0.22} />
      </RigidBody>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Ball Component (Unified Collision Detection Point)
// ─────────────────────────────────────────────────────────────────
function Ball({
  phase,
  ballTarget,
  shotSpeed,
  onShotEvaluated,
}: {
  phase: GamePhase;
  ballTarget: { x: number; y: number };
  shotSpeed: number;
  onShotEvaluated: (result: 'goal' | 'save' | 'miss') => void;
}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const glb = useGLTF(MODEL_PATHS.ball);
  const ballModel = glb.scene;

  const state = useRef({ launched: false, evaluated: false, previousZ: BALL_START_Z });

  useFrame(() => {
    if (!bodyRef.current) return;
    const s = state.current;

    if (phase === 'aiming') {
      s.launched = false;
      s.evaluated = false;
      s.previousZ = BALL_START_Z;
      bodyRef.current.setTranslation({ x: 0, y: BALL_RADIUS, z: BALL_START_Z }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    } else if (phase === 'shooting') {
      if (!s.launched) {
        s.launched = true;
        const flightTime = THREE.MathUtils.clamp(1.35 / shotSpeed, 0.45, 1.05);
        const gravity = -9.81;
        bodyRef.current.setLinvel({
          x: ballTarget.x / flightTime,
          y: (ballTarget.y - BALL_RADIUS - 0.5 * gravity * flightTime * flightTime) / flightTime,
          z: (GOAL_Z - BALL_START_Z) / flightTime,
        }, true);
        bodyRef.current.setAngvel({
          x: -18 * shotSpeed,
          y: THREE.MathUtils.clamp(-ballTarget.x * 1.2, -10, 10),
          z: -ballTarget.x * 1.8,
        }, true);
      }

      const position = bodyRef.current.translation();
      const crossedGoalLine = s.previousZ > GOAL_Z && position.z <= GOAL_Z;
      s.previousZ = position.z;

      if (crossedGoalLine && !s.evaluated) {
        s.evaluated = true;
        const inGoal =
          Math.abs(position.x) < GOAL_WIDTH / 2 - BALL_RADIUS &&
          position.y > BALL_RADIUS &&
          position.y < GOAL_HEIGHT - BALL_RADIUS;
        onShotEvaluated(inGoal ? 'goal' : 'miss');
      } else if (
        !s.evaluated &&
        (position.z > BALL_START_Z + 2 || position.y < -1)
      ) {
        s.evaluated = true;
        onShotEvaluated('miss');
      }
    }
  });

  if (!ballModel) return null;

  return (
    <RigidBody
      ref={bodyRef}
      name="ball"
      colliders={false}
      position={[0, BALL_RADIUS, BALL_START_Z]}
      enabledTranslations={[true, true, true]}
      enabledRotations={[true, true, true]}
      canSleep={false}
      ccd
      linearDamping={0.08}
      angularDamping={0.12}
      onCollisionEnter={({ other }) => {
        if (
          phase === 'shooting' &&
          !state.current.evaluated &&
          other.rigidBodyObject?.name === 'goalkeeper'
        ) {
          state.current.evaluated = true;
          onShotEvaluated('save');
        }
      }}
    >
      <BallCollider args={[BALL_RADIUS]} friction={0.65} restitution={0.58} />
      <primitive object={ballModel} scale={2.2} castShadow receiveShadow />
    </RigidBody>
  );
}

// ─────────────────────────────────────────────────────────────────
// Environment & Flashes
// ─────────────────────────────────────────────────────────────────
function Environment() {
  const { scene: goalModel } = useGLTF(MODEL_PATHS.goal);
  const grassTexture = useTexture('/grass.png');

  // Configure seamless grass texture tiling
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(8, 6);
  grassTexture.colorSpace = THREE.SRGBColorSpace;

  // Only nearby gameplay geometry needs dynamic shadows. The grandstand is
  // visually distant and far too expensive to include in every shadow pass.
  useEffect(() => {
    const configureShadows = (model: THREE.Object3D | null, castsShadow: boolean) => {
      if (model) {
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = castsShadow;
            child.receiveShadow = castsShadow;
          }
        });
      }
    };

    configureShadows(goalModel, true);
  }, [goalModel]);

  const PLAYGROUND_Y = 0.05;

  return (
    <group>
      {/* B. The Active Gameplay Field Group */}
      <group position={[0, PLAYGROUND_Y, 0]}>
        {/* Grass Pitch */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -10]}
          receiveShadow
        >
          <planeGeometry args={[60, 100]} />
          <meshStandardMaterial map={grassTexture} roughness={0.8} metalness={0.0} />
        </mesh>

        <PitchMarkings />

        {/* 3D Goal Frame */}
        {goalModel && (
          <primitive
            object={goalModel}
            position={[0, 0, GOAL_Z]}
            rotation={[0, 0, 0]}
            scale={[2, 2, 2]}
          />
        )}

      </group>

    </group>
  );
}

function Seating() {
  const { scene } = useGLTF(MODEL_PATHS.seating);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[-50, -6, GOAL_Z - 100]}
      rotation={[0, 0, 0]}
      scale={[0.3, 0.5, 0.6]}
    />
  );
}

function DeferredSeating() {
  const [showSeating, setShowSeating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSeating(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showSeating) return null;

  return (
    <Suspense fallback={null}>
      <Seating />
    </Suspense>
  );
}

function PhysicsColliders() {
  const postRadius = 0.16;

  return (
    <>
      <RigidBody type="fixed" name="ground" colliders={false}>
        <CuboidCollider
          args={[25, 0.1, 20]}
          position={[0, -0.1, 0]}
          friction={0.72}
          restitution={0.4}
        />
      </RigidBody>

      <RigidBody type="fixed" name="goal-frame" colliders={false}>
        <CuboidCollider
          args={[postRadius, GOAL_HEIGHT / 2, postRadius]}
          position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z]}
          restitution={0.72}
          friction={0.35}
        />
        <CuboidCollider
          args={[postRadius, GOAL_HEIGHT / 2, postRadius]}
          position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z]}
          restitution={0.72}
          friction={0.35}
        />
        <CuboidCollider
          args={[GOAL_WIDTH / 2, postRadius, postRadius]}
          position={[0, GOAL_HEIGHT, GOAL_Z]}
          restitution={0.72}
          friction={0.35}
        />
      </RigidBody>

      {/* A shallow invisible goal box gives convincing net catches without cloth simulation. */}
      <RigidBody type="fixed" name="net" colliders={false}>
        <CuboidCollider
          args={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0.08]}
          position={[0, GOAL_HEIGHT / 2, GOAL_Z - 2.4]}
          restitution={0.08}
          friction={0.9}
        />
        <CuboidCollider
          args={[0.08, GOAL_HEIGHT / 2, 1.2]}
          position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z - 1.2]}
          restitution={0.08}
        />
        <CuboidCollider
          args={[0.08, GOAL_HEIGHT / 2, 1.2]}
          position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, GOAL_Z - 1.2]}
          restitution={0.08}
        />
        <CuboidCollider
          args={[GOAL_WIDTH / 2, 0.08, 1.2]}
          position={[0, GOAL_HEIGHT, GOAL_Z - 1.2]}
          restitution={0.08}
        />
      </RigidBody>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// PitchMarkings Component (Goalmouth Line & Penalty Spot)
// ─────────────────────────────────────────────────────────────────
function PitchMarkings() {
  const lineWidth = 0.12; // Standard chalk line width
  const lineOpacity = 0.5; // Blending it into your turf texture

  return (
    <group>
      {/* 1. White Penalty Spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, BALL_START_Z]}>
        <ringGeometry args={[0, 0.28, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={lineOpacity} transparent />
      </mesh>

      {/* 2. Goalmouth Baseline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, GOAL_Z]}>
        <planeGeometry args={[40.2, lineWidth]} />
        <meshBasicMaterial color="#ffffff" opacity={lineOpacity} transparent />
      </mesh>

      {/* 3. Penalty Box (18-Yard Box) - Front Parallel Line */}
      {/* Placed 16.5 meters forward from the GOAL_Z baseline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, GOAL_Z - 16.5]}>
        <planeGeometry args={[40.2, lineWidth]} />
        <meshBasicMaterial color="#ffffff" opacity={lineOpacity} transparent />
      </mesh>

      {/* 4. Penalty Box - Left Side Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20.1, 0.04, GOAL_Z - 8.25]}>
        <planeGeometry args={[lineWidth, 16.5]} />
        <meshBasicMaterial color="#ffffff" opacity={lineOpacity} transparent />
      </mesh>

      {/* 5. Penalty Box - Right Side Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20.1, 0.04, GOAL_Z - 8.25]}>
        <planeGeometry args={[lineWidth, 16.5]} />
        <meshBasicMaterial color="#ffffff" opacity={lineOpacity} transparent />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Straight aiming guide. Its endpoint uses the exact shot calculation.
// ─────────────────────────────────────────────────────────────────
function AimGuide({
  dragStart,
  dragCur,
}: {
  dragStart: { x: number; y: number };
  dragCur: { x: number; y: number };
}) {
  const target = calculateAimTarget(dragStart, dragCur);
  if (!target) return null;

  const end = new THREE.Vector3(target.x, target.y, GOAL_Z + 0.08);

  return (
    <group>
      <Line
        points={[
          new THREE.Vector3(0, BALL_RADIUS + 0.05, BALL_START_Z),
          end,
        ]}
        color="#ffffff"
        lineWidth={2.4}
        opacity={0.82}
        transparent
        depthTest={false}
      />
      <mesh position={end} renderOrder={10}>
        <ringGeometry args={[0.16, 0.23, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          opacity={0.95}
          transparent
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Camera Controller (Smooth Follow and Goal Shake)
// ─────────────────────────────────────────────────────────────────
function CameraController({
  phase,
  ballTarget,
}: {
  phase: GamePhase;
  ballTarget: { x: number; y: number };
}) {
  const shakeRef = useRef({ time: 0, intensity: 0 });

  useEffect(() => {
    if (phase === 'result_goal') {
      shakeRef.current.time = 0.45;
      shakeRef.current.intensity = 0.25;
    }
  }, [phase]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const shake = shakeRef.current;

    // Cinematic base coordinates
    let targetX = 0;
    let targetY = 3.2;
    let targetZ = 28;

    if (phase === 'shooting') {
      // Dynamic zoom and pan to follow the ball
      targetX = ballTarget.x * 0.15;
      targetY = 2.8 + ballTarget.y * 0.12;
      targetZ = 26;
    } else if (phase === 'result_goal' || phase === 'result_save' || phase === 'result_miss') {
      // Zoom close to celebration/save area
      targetX = ballTarget.x * 0.2;
      targetY = 2.6;
      targetZ = 22;
    }

    // Smooth camera interpolation
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3.5);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 3.5);

    // Camera shake implementation
    if (shake.time > 0) {
      shake.time -= delta;
      const currentIntensity = (shake.time / 0.45) * shake.intensity;
      camera.position.x += (Math.random() - 0.5) * currentIntensity;
      camera.position.y += (Math.random() - 0.5) * currentIntensity;
    }

    // Smooth focal tracking
    const targetFocal = new THREE.Vector3(
      THREE.MathUtils.lerp(0, ballTarget.x * 0.25, phase === 'shooting' ? 0.6 : 0),
      1.7,
      0
    );
    camera.lookAt(targetFocal);
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Main Orchestration View
// ─────────────────────────────────────────────────────────────────
export default function PenaltyGame3D({
  onGameFinished,
}: {
  onGameFinished: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>('aiming');
  const [score, setScore] = useState(0);
  const [shotsTaken, setShotsTaken] = useState(0);
  const [muted, setMuted] = useState(false);

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [dragCur, setDragCur] = useState<{ x: number; y: number } | null>(null);
  const [ballTarget, setBallTarget] = useState({ x: 0, y: 0 });
  const [shotSpeed, setShotSpeed] = useState(1.6);

  // Lock target calculation at the point of flick launch
  const [lockedGkTargetX, setLockedGkTargetX] = useState(0);
  const [keeperShouldSave, setKeeperShouldSave] = useState(false);

  const sfx = useMemo(() => new SoundFX(), []);

  // Fetch the muted state on client mount
  useEffect(() => {
    const savedMuted = localStorage.getItem('penalty_muted') === 'true';
    setMuted(savedMuted);
  }, []);

  // Sync mute setting to sfx manager
  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted, sfx]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'aiming') return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCur({ x: e.clientX, y: e.clientY });
    setDragStartTime(Date.now());
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (phase === 'aiming' && dragStart) {
      const current = { x: e.clientX, y: e.clientY };
      setDragCur(current);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (phase !== 'aiming' || !dragStart) return;

    const dt = (Date.now() - dragStartTime) / 1000; // in seconds
    const aimTarget = calculateAimTarget(dragStart, {
      x: e.clientX,
      y: e.clientY,
    });

    // Require an affirmative upward swipe
    if (!aimTarget) {
      setDragStart(null);
      setDragCur(null);
      return;
    }

    const power = calculateShotPower(aimTarget.distance, dt);
    const finalShotSpeed = THREE.MathUtils.lerp(0.9, 3, power);

    const aimX = aimTarget.x;
    const aimY = aimTarget.y;

    // AI Goalkeeper commit sector calculation
    const goalieIQ = getGoalkeeperAccuracy(shotsTaken);
    const willGuessCorrectly = Math.random() < goalieIQ;
    const shotDirection = Math.sign(aimX) || (Math.random() < 0.5 ? -1 : 1);
    // Early mistakes should usually look like a late/short dive, not a keeper
    // inexplicably choosing the opposite side.
    const readsDirection = Math.random() < 0.82;
    let finalGkX = readsDirection
      ? THREE.MathUtils.clamp(
          aimX * THREE.MathUtils.lerp(0.38, 0.68, Math.random()),
          -MAX_KEEPER_X,
          MAX_KEEPER_X
        )
      : -shotDirection * THREE.MathUtils.lerp(1.2, 2.5, Math.random());

    if (willGuessCorrectly) {
      const predictionError = THREE.MathUtils.lerp(1.3, 0.2, goalieIQ);
      finalGkX = THREE.MathUtils.clamp(
        aimX + (Math.random() - 0.5) * predictionError,
        -MAX_KEEPER_X,
        MAX_KEEPER_X
      );
    }

    setShotSpeed(finalShotSpeed);
    setLockedGkTargetX(finalGkX);
    setKeeperShouldSave(willGuessCorrectly);
    setBallTarget({ x: aimX, y: Math.max(0.25, aimY) });
    setPhase('shooting');
    sfx.playKick();

    setDragStart(null);
    setDragCur(null);
  };

  const handleShotEvaluated = (result: 'goal' | 'save' | 'miss') => {
    setShotsTaken((shots) => shots + 1);

    if (result === 'goal') {
      sfx.playCheer();
      setPhase('result_goal');
      setScore((currentScore) => currentScore + 1);

      setTimeout(() => {
        setPhase('aiming');
      }, 1900);
    } else {
      sfx.playGroan();
      setPhase(result === 'save' ? 'result_save' : 'result_miss');
      setTimeout(() => {
        onGameFinished(score);
      }, 1900);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMute = !muted;
    setMuted(nextMute);
    localStorage.setItem('penalty_muted', String(nextMute));
  };

  return (
    <div
      className="fixed inset-0 z-50 h-dvh w-screen bg-[#040409] select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.25]}
        camera={{ position: [0, 3.2, 28], fov: 52 }}
        onCreated={({ gl }) => {
          gl.domElement.style.width = '100%';
          gl.domElement.style.height = '100%';
        }}
      >
        <Suspense fallback={null}>
          <Sky distance={450000} sunPosition={[0, 0.4, -1]} inclination={0} azimuth={0.25} />
          <ambientLight intensity={0.45} />
          <directionalLight
            castShadow
            position={[6, 16, 12]}
            intensity={1.55}
            shadow-mapSize={[1024, 1024]}
          />
          <color attach="background" args={['#08080d']} />

          <Environment />
          <DeferredSeating />
          <PitchMarkings />

          <Physics
            gravity={[0, -9.81, 0]}
            timeStep={1 / 60}
            interpolate
          >
            <PhysicsColliders />
            <Goalkeeper
              phase={phase}
              gkTargetX={phase === 'aiming' ? 0 : lockedGkTargetX}
              ballTarget={ballTarget}
              difficultyLevel={shotsTaken + 1}
              shouldSave={keeperShouldSave}
            />

            <Ball
              phase={phase}
              ballTarget={ballTarget}
              shotSpeed={shotSpeed}
              onShotEvaluated={handleShotEvaluated}
            />
          </Physics>

          {phase === 'aiming' && dragStart && dragCur && (
            <AimGuide dragStart={dragStart} dragCur={dragCur} />
          )}

          <CameraController phase={phase} ballTarget={ballTarget} />

        </Suspense>
      </Canvas>

      {/* Top Banner HUD */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-lg rounded-2xl px-8 py-3 flex gap-8 items-center border border-white/10 shadow-2xl pointer-events-none">
        <div className="text-center">
          <div className="text-white/50 text-[9px] font-bold tracking-widest mb-0.5">SHOTS TAKEN</div>
          <div className="text-white text-3xl font-black">{shotsTaken}</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-white/50 text-[9px] font-bold tracking-widest mb-0.5">CURRENT SCORE</div>
          <div className="text-green-400 text-3xl font-black">{score}</div>
        </div>
      </div>

      {/* Top Right Sound Toggle */}
      <button
        onClick={handleToggleMute}
        className="absolute top-6 right-6 p-3 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-white hover:bg-white/10 active:scale-95 transition-all z-40 cursor-pointer shadow-lg"
        title={muted ? 'Unmute Sound' : 'Mute Sound'}
      >
        {muted ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Goal Banners */}
      {(phase === 'result_goal' || phase === 'result_save' || phase === 'result_miss') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 animate-fade-in">
          <h1 className={`text-7xl md:text-9xl font-black italic tracking-tighter drop-shadow-2xl transition-all ${phase === 'result_goal' ? 'text-yellow-400 scale-110' :
            phase === 'result_save' ? 'text-red-500 scale-105' : 'text-zinc-400'
            }`}>
            {phase === 'result_goal' ? 'GOAL!' : phase === 'result_save' ? 'SAVED!' : 'MISSED!'}
          </h1>
        </div>
      )}

    </div>
  );
}
