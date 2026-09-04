import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import type { PublicProfile } from "@believe-ai/shared";
import { CardFrontContent, CardBackContent } from "./CardFaceContent.js";
import { EnergyBorder } from "./EnergyBorder.js";
import { PALETTE } from "../palette.js";
import type { CinematicState } from "../motion/useCinematicEntrance.js";

const WIDTH = 2.2;
const HEIGHT = 3.15;
const DEPTH = 0.09;
const CORNER_RADIUS = 0.16;

const DAMPING = 0.94; // per ~60fps frame, scaled by delta below
const IDLE_DELAY = 1.4; // seconds of no interaction before idle float resumes
const RESET_LERP = 6; // higher = snappier reset

/** Real 360° drag rotation with momentum, built directly on pointer events
 * + a rotation ref (not React state — this updates every frame, so it must
 * stay outside the render cycle) rather than drei's PresentationControls:
 * that component's internal spring has no imperative "reset to front"
 * hook, which the brief's double-click/double-tap requirement needs. Idle
 * float is a small additive sine offset layered on top of the real
 * rotation, only once the card has been still for a beat. */
export function IdentityCard3D({
  profile,
  reducedMotion,
  onFirstInteraction,
  rotationRef,
  draggingRef,
  cinematicRef,
}: {
  profile: PublicProfile;
  reducedMotion: boolean;
  onFirstInteraction: () => void;
  /** Shared with sibling scene elements (e.g. FoxSpiritPresence) that react
   * to the card's live rotation/drag state without owning it themselves. */
  rotationRef: { current: { x: number; y: number } };
  draggingRef: { current: boolean };
  /** Anime.js-driven entrance values (see useCinematicEntrance) — the card
   * reads its scale/rotation settle from here every frame instead of
   * computing its own local entrance progress. */
  cinematicRef: { current: CinematicState };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  const rotation = rotationRef;
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = draggingRef;
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const lastInteraction = useRef(0);
  const resetting = useRef(false);
  const hintedOnce = useRef(false);
  const [showHint, setShowHint] = useState(true);

  // Auto-hint nudge shortly after mount — communicates "this is interactive"
  // without a full spin. Skipped under reduced motion.
  useEffect(() => {
    if (reducedMotion) return;
    const t = setTimeout(() => {
      if (dragging.current) return;
      velocity.current.y = 0.9; // a brief nudge; damping below settles it back out
    }, 1400);
    return () => clearTimeout(t);
  }, [reducedMotion, dragging]);

  const setCursor = useCallback(
    (value: string) => {
      gl.domElement.style.cursor = value;
    },
    [gl],
  );

  function endDrag() {
    dragging.current = false;
    setCursor("grab");
    window.removeEventListener("pointermove", handleWindowMove);
    window.removeEventListener("pointerup", endDrag);
  }

  function handleWindowMove(e: PointerEvent) {
    if (!dragging.current) return;
    const now = performance.now();
    const dt = Math.max((now - lastMoveTime.current) / 1000, 1 / 120);
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;

    rotation.current.y += dx * 0.008;
    rotation.current.x += dy * 0.008;
    velocity.current.y = (dx * 0.008) / dt;
    velocity.current.x = (dy * 0.008) / dt;

    lastPointer.current = { x: e.clientX, y: e.clientY };
    lastMoveTime.current = now;
    lastInteraction.current = now;
  }

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    dragging.current = true;
    resetting.current = false;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    lastMoveTime.current = performance.now();
    setCursor("grabbing");
    if (!hintedOnce.current) {
      hintedOnce.current = true;
      setShowHint(false);
      onFirstInteraction();
    }
    window.addEventListener("pointermove", handleWindowMove);
    window.addEventListener("pointerup", endDrag);
  }

  function handleDoubleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    resetting.current = true;
    velocity.current = { x: 0, y: 0 };
  }

  useEffect(() => setCursor("grab"), [setCursor]);

  useFrame((state, delta) => {
    if (!dragging.current) {
      if (resetting.current) {
        rotation.current.x = THREE.MathUtils.damp(rotation.current.x, 0, RESET_LERP, delta);
        rotation.current.y = THREE.MathUtils.damp(rotation.current.y, 0, RESET_LERP, delta);
        if (Math.abs(rotation.current.x) < 0.001 && Math.abs(rotation.current.y) < 0.001) {
          rotation.current = { x: 0, y: 0 };
          resetting.current = false;
        }
      } else {
        const dampFactor = Math.pow(DAMPING, delta * 60);
        velocity.current.x *= dampFactor;
        velocity.current.y *= dampFactor;
        rotation.current.x += velocity.current.x * delta;
        rotation.current.y += velocity.current.y * delta;
      }
    }

    let x = rotation.current.x;
    let y = rotation.current.y;

    // Idle zero-gravity float: only once still for a beat, additive so it
    // never fights the user's actual rotation. Deliberately not drei's
    // <Float> here — that component also drives position/rotation every
    // frame, and layering it on top of this manual rotation loop would have
    // the two fight over the same transform. Folding the vertical bob into
    // this same loop keeps one system in control.
    let bobY = 0;
    if (!reducedMotion && !dragging.current && !resetting.current) {
      const idleFor = (performance.now() - lastInteraction.current) / 1000;
      if (idleFor > IDLE_DELAY) {
        const t = state.clock.elapsedTime;
        x += Math.sin(t * 0.7) * 0.009; // ~9s cycle, ~0.5deg
        y += Math.sin(t * 0.85) * 0.017; // ~7.4s cycle, ~1deg
        bobY = Math.sin(t * 0.95) * 0.04; // ~6.6s cycle
      }
    }

    // Cinematic entrance: card settles from a slight rotational offset and
    // a smaller scale into resting position, additive on top of whatever
    // interactive rotation already exists (0 at this point, since nobody
    // can realistically start dragging within the first frame). Values are
    // owned by the Anime.js timeline in useCinematicEntrance, not computed
    // locally — this card just reflects them every frame.
    const cinematic = cinematicRef.current;
    x += cinematic.cardRotX;
    y += cinematic.cardRotY;
    const scale = cinematic.cardScale;

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.clamp(x, -Math.PI * 0.9, Math.PI * 0.9);
      groupRef.current.rotation.y = y;
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, bobY, 4, delta);
      groupRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      <RoundedBox args={[WIDTH, HEIGHT, DEPTH]} radius={CORNER_RADIUS} smoothness={4} creaseAngle={0.4}>
        <meshPhysicalMaterial
          color={PALETTE.cardSurface.base}
          roughness={0.38}
          metalness={0.18}
          clearcoat={0.75}
          clearcoatRoughness={0.2}
          iridescence={0.85}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
          reflectivity={0.4}
        />
      </RoundedBox>

      <EnergyBorder rotationRef={rotation} draggingRef={dragging} cinematicRef={cinematicRef} />

      <Html transform occlude distanceFactor={1.55} position={[0, 0, DEPTH / 2 + 0.001]} className="pointer-events-auto">
        <CardFrontContent profile={profile} showHint={showHint} />
      </Html>

      <Html
        transform
        occlude
        distanceFactor={1.55}
        position={[0, 0, -DEPTH / 2 - 0.001]}
        rotation={[0, Math.PI, 0]}
        className="pointer-events-auto"
      >
        <CardBackContent profile={profile} publicUrl={`${window.location.origin}/u/${profile.username}`} />
      </Html>
    </group>
  );
}
