import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import type { CardTheme } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { IdentityCard, type IdentityCardProfile } from "./IdentityCard.js";
import { HolographicIdentityCard } from "./HolographicIdentityCard.js";

export function ShareProfileModal({
  profile,
  theme,
  username,
  onClose,
}: {
  profile: IdentityCardProfile;
  theme: CardTheme;
  username: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const publicUrl = `${window.location.origin}/u/${username}`;

  useEffect(() => {
    if (qrCanvasRef.current) {
      void QRCode.toCanvas(qrCanvasRef.current, publicUrl, { width: 132, margin: 1, color: { dark: "#0e0f14" } });
    }
  }, [publicUrl]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied/unavailable (blocked by browser policy, an
      // extension, or an insecure context) — the link is already shown in the
      // modal for the user to select and copy by hand, so this fails quietly
      // rather than showing a false "Copied" state.
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${username}-believe-identity.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: `${profile.name} on believe.ai`, url: publicUrl });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Share your profile</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">Your developer identity, in one link.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex justify-center">
          {theme === "holographic" ? (
            <HolographicIdentityCard ref={cardRef} profile={profile} />
          ) : (
            <IdentityCard ref={cardRef} profile={profile} theme={theme} />
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-ink-100 p-3 dark:border-ink-800">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-700 dark:text-ink-200">{publicUrl}</p>
          </div>
          <canvas ref={qrCanvasRef} className="h-[66px] w-[66px] shrink-0 rounded-lg" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? "Downloading…" : "Download card"}
          </Button>
          {typeof navigator !== "undefined" && !!navigator.share && (
            <Button size="sm" className="col-span-2" onClick={handleNativeShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
