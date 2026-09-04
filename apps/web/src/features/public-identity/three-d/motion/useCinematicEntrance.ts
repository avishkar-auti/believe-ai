import { useEffect, useRef } from "react";
import { createTimeline } from "animejs";

export interface CinematicState {
  /** Starfield opacity multiplier. */
  galaxy: number;
  /** Fox-spirit silhouette reveal. */
  kurama: number;
  /** Fox-spirit eye-glow reveal. */
  eyeIntensity: number;
  cardScale: number;
  /** Additive rotation offset (radians) — settles to 0. */
  cardRotX: number;
  cardRotY: number;
  /** Energy-border opacity multiplier. */
  auraReveal: number;
}

const INITIAL: CinematicState = {
  galaxy: 0,
  kurama: 0,
  eyeIntensity: 0,
  cardScale: 0.82,
  cardRotX: 0.1047, // +6deg
  cardRotY: -0.2618, // -15deg
  auraReveal: 0,
};

const SETTLED: Partial<CinematicState> = {
  galaxy: 1,
  kurama: 1,
  eyeIntensity: 1,
  cardScale: 1,
  cardRotX: 0,
  cardRotY: 0,
  auraReveal: 1,
};

/** Choreographs the public-profile entrance as one Anime.js timeline
 * instead of every scene element independently guessing its own fade-in
 * off absolute clock time (which is how Phase 1/2 did it, and how
 * EnergyBorder/FoxSpiritPresence's fade-ins used to be computed inline).
 * Anime.js mutates this plain object in place on every tick; R3F consumers
 * read the values inside their own useFrame — never through React state,
 * which would mean 60 setState calls a second. Under reduced motion, a
 * single short fade replaces the full choreography: no card fly-in, no
 * Kurama reveal, no rotational settle — manual drag rotation is unaffected
 * either way, it's driven entirely separately. */
export function useCinematicEntrance(reducedMotion: boolean) {
  const state = useRef<CinematicState>({ ...INITIAL });

  useEffect(() => {
    if (reducedMotion) {
      const timeline = createTimeline({ defaults: { ease: "outQuad" } }).add(state.current, {
        ...SETTLED,
        duration: 250,
      });
      return () => {
        timeline.revert();
      };
    }

    const timeline = createTimeline({ defaults: { ease: "outExpo" } })
      .add(state.current, { galaxy: 1, duration: 500 })
      .add(state.current, { kurama: 1, duration: 550 }, "-=300")
      .add(state.current, { eyeIntensity: 1, duration: 400 }, "-=350")
      .add(state.current, { cardScale: 1, cardRotX: 0, cardRotY: 0, duration: 900, ease: "outQuint" }, "-=350")
      .add(state.current, { auraReveal: 1, duration: 500 }, "-=450");

    return () => {
      timeline.revert();
    };
  }, [reducedMotion]);

  return state;
}
