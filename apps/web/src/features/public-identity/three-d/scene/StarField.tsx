import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CinematicState } from "../motion/useCinematicEntrance.js";

const BASE_OPACITY = 0.85;

/** A gaussian-ish random offset (sum of uniform randoms) — clusters values
 * toward the mean instead of spreading flat, which is what makes clustered
 * point placement look organic instead of a grid of evenly-spaced dots. */
function gaussian(spread: number) {
  return (Math.random() + Math.random() + Math.random() - 1.5) * (spread / 1.5);
}

function buildStarField(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // A handful of cluster centers plus a uniform baseline — mixing the two
  // is what creates dense/sparse/empty regions rather than an even field.
  const clusterCount = 7;
  const clusters = Array.from({ length: clusterCount }, () => ({
    x: (Math.random() - 0.5) * radius * 1.6,
    y: (Math.random() - 0.5) * radius * 1.6,
    z: -radius * 0.3 - Math.random() * radius * 0.7,
  }));

  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number;
    if (Math.random() < 0.6) {
      const c = clusters[Math.floor(Math.random() * clusterCount)]!;
      x = c.x + gaussian(radius * 0.35);
      y = c.y + gaussian(radius * 0.35);
      z = c.z + gaussian(radius * 0.2);
    } else {
      x = (Math.random() - 0.5) * radius * 2;
      y = (Math.random() - 0.5) * radius * 2;
      z = -radius * 0.2 - Math.random() * radius;
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Brightness varies per star (dim to bright white) since a flat
    // PointsMaterial has no per-point alpha — vertex-color luminance stands
    // in for it.
    const brightness = 0.35 + Math.random() * 0.65;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness + Math.random() * 0.08; // faint cool tint
  }

  return { positions, colors };
}

/** A single layered starfield — count is caller-supplied so the page can
 * drop it on narrow/low-power viewports. Near-static: a barely-perceptible
 * rotation is the only motion, so it reads as "infinite" without drawing
 * attention away from the card. */
export function StarField({
  count = 3000,
  radius = 40,
  cinematicRef,
}: {
  count?: number;
  radius?: number;
  cinematicRef: { current: CinematicState };
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { positions, colors } = useMemo(() => buildStarField(count, radius), [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.003;
    if (materialRef.current) materialRef.current.opacity = BASE_OPACITY * cinematicRef.current.galaxy;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.055}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
