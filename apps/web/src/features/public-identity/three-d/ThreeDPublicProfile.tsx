import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import type { PublicProfile } from "@believe-ai/shared";
import { PALETTE } from "./palette.js";
import { useWebglSupport } from "./hooks/useWebglSupport.js";
import { ThreeDProfileScene } from "./ThreeDProfileScene.js";
import { SceneOverlayUI } from "./overlay/SceneOverlayUI.js";
import { HolographicIdentityCard } from "../../settings/HolographicIdentityCard.js";

function getStarCount() {
  if (typeof window === "undefined") return 1500;
  return window.innerWidth < 640 ? 1200 : 3000;
}

/** The 3D identity experience for holographic-styled public profiles.
 * Falls back to the existing CSS HolographicIdentityCard (unchanged,
 * already good-looking) on a dark cosmic background when WebGL isn't
 * available — profile info stays fully accessible either way. */
export function ThreeDPublicProfile({ profile }: { profile: PublicProfile }) {
  const webglSupported = useWebglSupport();
  const reducedMotion = useReducedMotion();
  const [starCount] = useState(getStarCount);

  if (!webglSupported) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-16"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${PALETTE.background.top} 0%, ${PALETTE.background.mid} 55%, ${PALETTE.background.deep} 100%)`,
        }}
      >
        <HolographicIdentityCard profile={profile} />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ background: PALETTE.background.deep }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true }}
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={[PALETTE.background.deep]} />
        <fog attach="fog" args={[PALETTE.background.deep, 11, 28]} />
        <ThreeDProfileScene
          profile={profile}
          starCount={starCount}
          reducedMotion={!!reducedMotion}
          onFirstInteraction={() => {}}
        />
      </Canvas>
      <SceneOverlayUI username={profile.username} reducedMotion={!!reducedMotion} />
    </div>
  );
}
