import { useMemo } from "react";
import * as THREE from "three";

/** Generates a soft radial-gradient sprite texture once (canvas → texture),
 * not per frame — this is the classic cheap way to get a glow in Three.js
 * without shipping an image asset or writing a shader. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.16)");
    gradient.addColorStop(0.5, "rgba(124, 58, 237, 0.06)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/** A quiet atmospheric glow behind the card — light suspended in space, not
 * a visible disc. Kept well behind the card on Z so it never competes with
 * it for visual weight. */
export function CardAura() {
  const texture = useGlowTexture();
  if (!texture) return null;

  return (
    <sprite position={[0, 0, -1.5]} scale={[7, 7, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
