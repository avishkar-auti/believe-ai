import { useRef } from "react";
import type { PublicProfile } from "@believe-ai/shared";
import { StarField } from "./scene/StarField.js";
import { SceneLighting } from "./scene/SceneLighting.js";
import { CardAura } from "./scene/CardAura.js";
import { FoxSpiritPresence } from "./scene/FoxSpiritPresence.js";
import { ChakraPortal } from "./card/ChakraPortal.js";
import { IdentityCard3D } from "./card/IdentityCard3D.js";
import { useCinematicEntrance } from "./motion/useCinematicEntrance.js";

export function ThreeDProfileScene({
  profile,
  starCount,
  reducedMotion,
  onFirstInteraction,
}: {
  profile: PublicProfile;
  starCount: number;
  reducedMotion: boolean;
  onFirstInteraction: () => void;
}) {
  // Shared with FoxSpiritPresence so its restrained "reacts to interaction"
  // brightness bump can read the card's live drag state without owning it.
  const rotationRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  // Anime.js-driven entrance values, read every frame by useFrame consumers
  // instead of each element computing its own fade-in off elapsed time.
  const cinematicRef = useCinematicEntrance(reducedMotion);

  return (
    <>
      <StarField count={starCount} cinematicRef={cinematicRef} />
      <SceneLighting />
      <FoxSpiritPresence draggingRef={draggingRef} reducedMotion={reducedMotion} cinematicRef={cinematicRef} />
      <ChakraPortal />
      <CardAura />
      <IdentityCard3D
        profile={profile}
        reducedMotion={reducedMotion}
        onFirstInteraction={onFirstInteraction}
        rotationRef={rotationRef}
        draggingRef={draggingRef}
        cinematicRef={cinematicRef}
      />
    </>
  );
}
