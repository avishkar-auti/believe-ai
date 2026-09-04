import { useEffect, useRef, useState } from "react";

/**
 * Real active-speaker detection: one Web Audio AnalyserNode per live
 * MediaStream that actually carries an audio track. Nothing is simulated — a
 * tile only lights up when that participant's own audio crosses the threshold.
 *
 * Keyed by participant id so the caller can pass local + remote streams in one
 * map and get back the set of ids currently speaking.
 */
export function useSpeakingDetection(streams: Map<string, MediaStream>): Set<string> {
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());
  const frameRef = useRef<number | null>(null);

  const keys = Array.from(streams.keys()).sort().join("|");

  useEffect(() => {
    const entries = Array.from(streams.entries()).filter(([, s]) => s.getAudioTracks().length > 0);
    if (entries.length === 0) {
      setSpeaking(new Set());
      return;
    }

    const AudioCtx: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analysers: Array<{ id: string; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }> = [];

    for (const [id, stream] of entries) {
      try {
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analysers.push({ id, analyser, data: new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)) });
      } catch {
        // A stream can end between the render and this effect — skip it.
      }
    }

    let last = "";
    function tick() {
      const active: string[] = [];
      for (const { id, analyser, data } of analysers) {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] as number;
        if (sum / data.length > 12) active.push(id);
      }
      const next = active.sort().join("|");
      if (next !== last) {
        last = next;
        setSpeaking(new Set(active));
      }
      frameRef.current = window.requestAnimationFrame(tick);
    }
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      void ctx.close().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return speaking;
}
