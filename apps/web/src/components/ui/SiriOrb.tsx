/**
 * The Siri-style AI presence indicator, used in chat workspaces. Renders the
 * provided orb video on a loop, masked to a circle — it keeps this exact
 * look in both light and dark app themes since the video has its own opaque
 * background regardless of theme.
 */
export function SiriOrb({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: "#040c1a",
        borderRadius: "9999px",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <video
        src="/media/siri-orb.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full rounded-full object-contain"
        style={{ transform: "scale(2.4)" }}
      />
    </div>
  );
}
