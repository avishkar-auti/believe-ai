import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "../palette.js";
import type { CinematicState } from "../motion/useCinematicEntrance.js";

const WIDTH = 2.2;
const HEIGHT = 3.15;
const CORNER_RADIUS = 0.16;
const OUTSET = 0.045;
const CORE_TUBE_RADIUS = 0.015;
const GLOW_TUBE_RADIUS = 0.05;
const CORE_OPACITY = 0.95;
const GLOW_OPACITY = 0.32;

/** Traces a rounded-rect matching the card's own silhouette as a closed loop
 * of points (corner arcs + straight-edge segments), then wraps it in a
 * CatmullRomCurve3 for TubeGeometry to follow. Not a perfectly analytic
 * rounded rect — visual quality at this scale is what matters, not
 * geometric precision, and a closed spline through enough points reads as
 * clean rounded corners with straight edges either side. */
function buildRoundedRectCurve(width: number, height: number, radius: number) {
  const hw = width / 2;
  const hh = height / 2;
  const cornerSegs = 10;
  const edgeSegs = 3;
  const points: THREE.Vector3[] = [];
  const corners: [number, number, number, number][] = [
    [hw - radius, hh - radius, 0, Math.PI / 2],
    [-(hw - radius), hh - radius, Math.PI / 2, Math.PI],
    [-(hw - radius), -(hh - radius), Math.PI, (3 * Math.PI) / 2],
    [hw - radius, -(hh - radius), (3 * Math.PI) / 2, 2 * Math.PI],
  ];

  for (let c = 0; c < 4; c++) {
    const [cx, cy, a0, a1] = corners[c]!;
    for (let i = 0; i <= cornerSegs; i++) {
      const t = i / cornerSegs;
      const a = a0 + (a1 - a0) * t;
      points.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0));
    }
    const next = corners[(c + 1) % 4]!;
    const last = points[points.length - 1]!;
    const nextStart = new THREE.Vector3(next[0] + Math.cos(next[2]) * radius, next[1] + Math.sin(next[2]) * radius, 0);
    for (let i = 1; i <= edgeSegs; i++) {
      const t = i / (edgeSegs + 1);
      points.push(
        new THREE.Vector3(THREE.MathUtils.lerp(last.x, nextStart.x, t), THREE.MathUtils.lerp(last.y, nextStart.y, t), 0),
      );
    }
  }

  return new THREE.CatmullRomCurve3(points, true);
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Two chakra streams continuously travel around the loop and cross twice
// per revolution. Noise is a couple of layered sines rather than a real
// simplex function — cheap, and organic enough at this scale to not need a
// noise-function dependency for one thin ribbon of color.
const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uBalance;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform vec3 uRed;
  uniform vec3 uBlue;
  uniform vec3 uViolet;
  uniform vec3 uHotspot;
  varying vec2 vUv;

  void main() {
    float wobble = sin(vUv.x * 40.0 + uTime * 3.0) * 0.015
                 + sin(vUv.x * 17.0 - uTime * 1.7) * 0.01;
    float flow = fract(vUv.x + uTime * 0.1 + wobble);
    float wave = sin(flow * 6.28318530718);

    float split = smoothstep(-0.2, 0.2, wave);
    vec3 color = mix(uRed, uBlue, split);

    float crossover = 1.0 - smoothstep(0.0, 0.35, abs(wave));
    color = mix(color, uViolet, crossover * 0.75);

    float pulse = pow(max(0.0, sin(uTime * 0.9 + flow * 3.0)), 10.0);
    color = mix(color, uHotspot, crossover * pulse * 0.8);

    vec3 warmBoost = vec3(1.15, 1.0, 0.92);
    vec3 coolBoost = vec3(0.92, 1.0, 1.15);
    float b = clamp(uBalance, -1.0, 1.0);
    color *= mix(warmBoost, coolBoost, b * 0.5 + 0.5);

    color *= uIntensity;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

interface EnergyUniforms {
  uTime: { value: number };
  uBalance: { value: number };
  uIntensity: { value: number };
  uOpacity: { value: number };
}

function createEnergyMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBalance: { value: 0 },
      uIntensity: { value: 1 },
      uOpacity: { value: 0 },
      uRed: { value: new THREE.Color(PALETTE.red.core) },
      uBlue: { value: new THREE.Color(PALETTE.blue.core) },
      uViolet: { value: new THREE.Color(PALETTE.violet.crossover) },
      uHotspot: { value: new THREE.Color(PALETTE.violet.hotspot) },
    },
  });
}

/** The card's signature dual red/blue chakra border — a real TubeGeometry
 * traced around the card's own rounded-rect silhouette, not a CSS ring.
 * Reads rotation/drag directly off the refs IdentityCard3D already
 * maintains every frame, so it reacts without routing state through React.
 * Two coincident tubes (tight "core" + larger additive "glow") stand in for
 * a real bloom pass — cheaper, and convincing against the near-black scene. */
export function EnergyBorder({
  rotationRef,
  draggingRef,
  cinematicRef,
}: {
  rotationRef: { current: { x: number; y: number } };
  draggingRef: { current: boolean };
  cinematicRef: { current: CinematicState };
}) {
  const curve = useMemo(
    () => buildRoundedRectCurve(WIDTH + OUTSET * 2, HEIGHT + OUTSET * 2, CORNER_RADIUS + OUTSET),
    [],
  );
  const coreGeometry = useMemo(() => new THREE.TubeGeometry(curve, 220, CORE_TUBE_RADIUS, 8, true), [curve]);
  const glowGeometry = useMemo(() => new THREE.TubeGeometry(curve, 220, GLOW_TUBE_RADIUS, 8, true), [curve]);
  const coreMaterial = useMemo(createEnergyMaterial, []);
  const glowMaterial = useMemo(createEnergyMaterial, []);
  const intensity = useRef(1);

  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      glowGeometry.dispose();
      coreMaterial.dispose();
      glowMaterial.dispose();
    };
  }, [coreGeometry, glowGeometry, coreMaterial, glowMaterial]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    intensity.current = THREE.MathUtils.damp(intensity.current, draggingRef.current ? 1.18 : 1, 5, delta);
    const balance = THREE.MathUtils.clamp(rotationRef.current.y / (Math.PI * 0.5), -1, 1);
    const fadeIn = cinematicRef.current.auraReveal;

    for (const [material, baseOpacity] of [
      [coreMaterial, CORE_OPACITY],
      [glowMaterial, GLOW_OPACITY],
    ] as const) {
      const uniforms = material.uniforms as unknown as EnergyUniforms;
      uniforms.uTime.value = t;
      uniforms.uBalance.value = balance;
      uniforms.uIntensity.value = intensity.current;
      uniforms.uOpacity.value = baseOpacity * fadeIn;
    }
  });

  return (
    <group>
      <mesh geometry={glowGeometry} material={glowMaterial} />
      <mesh geometry={coreGeometry} material={coreMaterial} />
    </group>
  );
}
