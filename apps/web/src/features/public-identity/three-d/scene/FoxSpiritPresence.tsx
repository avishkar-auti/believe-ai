import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "../palette.js";
import type { CinematicState } from "../motion/useCinematicEntrance.js";

const SILHOUETTE_SCALE = 11;
const EYE_OFFSET_X = 1.5;
const EYE_OFFSET_Y = -0.45;
const EMBER_COUNT = 46;

function createSilhouetteTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Blurred head + two ear peaks — enough to read as a fox silhouette
  // without hand-placing particles into real anatomy (that's fast-follow).
  ctx.filter = "blur(30px)";
  ctx.fillStyle = "rgba(255,86,40,0.85)";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.58, size * 0.3, size * 0.25, 0, 0, Math.PI * 2);
  ctx.moveTo(size * 0.32, size * 0.42);
  ctx.lineTo(size * 0.2, size * 0.08);
  ctx.lineTo(size * 0.44, size * 0.32);
  ctx.closePath();
  ctx.moveTo(size * 0.68, size * 0.42);
  ctx.lineTo(size * 0.8, size * 0.08);
  ctx.lineTo(size * 0.56, size * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.filter = "none";
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.04, size * 0.5, size * 0.5, size * 0.56);
  glow.addColorStop(0, "rgba(255,110,50,0.5)");
  glow.addColorStop(1, "rgba(255,60,20,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createEyeGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.25, `${PALETTE.kuramaEye.bright}dd`);
  gradient.addColorStop(1, "rgba(255,61,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createEmberField() {
  const positions = new Float32Array(EMBER_COUNT * 3);
  const speeds = new Float32Array(EMBER_COUNT);
  for (let i = 0; i < EMBER_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    speeds[i] = 0.12 + Math.random() * 0.22;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry, speeds, positions };
}

/** A soft glow-and-light construction standing in for a full particle-
 * sculpted fox spirit (that's the fast-follow version). A blurred canvas
 * silhouette gives the shape, two small bright sprites give it eyes, and a
 * sparse ember layer drifts off it — enough to read as "vast presence
 * behind the card" without hand-placing thousands of points into real
 * anatomy. Deliberately does not move or rotate with the card — per the
 * brief it should feel enormous and far away — it only nudges brighter for
 * a moment while the visitor is actively dragging the card. */
export function FoxSpiritPresence({
  draggingRef,
  reducedMotion,
  cinematicRef,
}: {
  draggingRef: { current: boolean };
  reducedMotion: boolean;
  cinematicRef: { current: CinematicState };
}) {
  const silhouetteTexture = useMemo(createSilhouetteTexture, []);
  const eyeTexture = useMemo(createEyeGlowTexture, []);
  const { geometry: emberGeometry, speeds: emberSpeeds, positions: emberPositions } = useMemo(createEmberField, []);
  const emberMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.055,
        color: PALETTE.red.ember,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  const silhouetteRef = useRef<THREE.Sprite>(null);
  const eyeLeftRef = useRef<THREE.Sprite>(null);
  const eyeRightRef = useRef<THREE.Sprite>(null);
  const brightness = useRef(1);

  useEffect(() => {
    return () => {
      silhouetteTexture.dispose();
      eyeTexture.dispose();
      emberGeometry.dispose();
      emberMaterial.dispose();
    };
  }, [silhouetteTexture, eyeTexture, emberGeometry, emberMaterial]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * ((2 * Math.PI) / 6.5)) * 0.5 + 0.5; // 6.5s cycle, 0..1
    const baseIntensity = 0.78 + breathe * 0.22; // brief's 0.78 -> 1 -> 0.78

    brightness.current = THREE.MathUtils.damp(brightness.current, draggingRef.current ? 1.08 : 1, 3, delta);
    const { kurama, eyeIntensity } = cinematicRef.current;

    if (silhouetteRef.current) {
      const material = silhouetteRef.current.material as THREE.SpriteMaterial;
      material.opacity = baseIntensity * 0.5 * brightness.current * kurama;
      const scalePulse = reducedMotion ? 1 : 1 + breathe * 0.02;
      silhouetteRef.current.scale.setScalar(SILHOUETTE_SCALE * scalePulse);
    }
    for (const eyeRef of [eyeLeftRef, eyeRightRef]) {
      const material = eyeRef.current?.material as THREE.SpriteMaterial | undefined;
      if (material) {
        material.opacity = (0.55 + breathe * 0.35) * brightness.current * eyeIntensity;
      }
    }

    if (!reducedMotion) {
      for (let i = 0; i < EMBER_COUNT; i++) {
        const yIndex = i * 3 + 1;
        emberPositions[yIndex]! += emberSpeeds[i]! * delta;
        if (emberPositions[yIndex]! > 4) {
          emberPositions[yIndex] = -4;
        }
      }
      emberGeometry.attributes.position!.needsUpdate = true;
    }
  });

  return (
    <group position={[-2.2, 1.6, -9]}>
      <sprite ref={silhouetteRef} scale={SILHOUETTE_SCALE}>
        <spriteMaterial
          map={silhouetteTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite ref={eyeLeftRef} position={[-EYE_OFFSET_X, EYE_OFFSET_Y, 0.05]} scale={0.6}>
        <spriteMaterial map={eyeTexture} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={eyeRightRef} position={[EYE_OFFSET_X, EYE_OFFSET_Y, 0.05]} scale={0.6}>
        <spriteMaterial map={eyeTexture} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <points geometry={emberGeometry} material={emberMaterial} />
    </group>
  );
}
