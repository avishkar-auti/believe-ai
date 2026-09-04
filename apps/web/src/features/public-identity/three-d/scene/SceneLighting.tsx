import { PALETTE } from "../palette.js";

/** Four-point cinematic rig so the card's reflections genuinely change as
 * it rotates, instead of reading flat under a single light. Colors follow
 * the card's own dual chakra story — warm red key on the left, cool blue
 * fill on the right, violet rim where they'd cross — rather than generic
 * white studio lighting. */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.22} />
      {/* Warm red key light, upper-left */}
      <pointLight position={[-4, 3, 3]} intensity={11} color={PALETTE.red.warm} distance={20} decay={2} />
      {/* Cool blue fill, right */}
      <pointLight position={[4, -1, 2]} intensity={7} color={PALETTE.blue.light} distance={20} decay={2} />
      {/* Violet rim where the two energies meet, rear */}
      <pointLight position={[0, 0, -4]} intensity={5} color={PALETTE.violet.crossover} distance={16} decay={2} />
      {/* Soft top light keeps the card legible regardless of rotation */}
      <directionalLight position={[0, 6, 4]} intensity={0.32} color="#FFFFFF" />
    </>
  );
}
