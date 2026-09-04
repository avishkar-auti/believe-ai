import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "../palette.js";

function createPortalTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  for (const [radius, width, color, alpha] of [
    [0.46, 0.012, PALETTE.violet.crossover, 0.5],
    [0.36, 0.01, PALETTE.blue.core, 0.4],
    [0.27, 0.01, PALETTE.red.core, 0.4],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx, cy, size * radius, 0, Math.PI * 2);
    ctx.lineWidth = size * width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  glow.addColorStop(0, "rgba(124,58,237,0.30)");
  glow.addColorStop(0.55, "rgba(76,40,150,0.14)");
  glow.addColorStop(1, "rgba(20,10,40,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.center.set(0.5, 0.5);
  texture.needsUpdate = true;
  return texture;
}

/** A faint chakra-seal ring the card appears to hover above. The scene's
 * camera is fixed and front-on rather than elevated, so a literal
 * horizontal ground plane would render almost edge-on and barely visible —
 * this is a flattened, camera-facing ellipse instead, which reads correctly
 * as "a ring on the ground below the card" from this specific viewpoint. */
export function ChakraPortal() {
  const texture = useMemo(createPortalTexture, []);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 0.5) * 0.04;
    meshRef.current?.scale.set(pulse, pulse * 0.42, 1);
    if (materialRef.current) {
      materialRef.current.opacity = 0.5 + Math.sin(t * 0.5) * 0.08;
    }
    texture.rotation = t * 0.06;
  });

  return (
    <mesh ref={meshRef} position={[0, -1.75, -0.4]}>
      <planeGeometry args={[4.2, 4.2]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
