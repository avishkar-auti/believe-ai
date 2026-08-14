import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Click tracking works by rewriting every link in an outgoing email to point
 * at the API's /t/click/:token endpoint, carrying the real destination in a
 * `u` query parameter.
 *
 * That destination is attacker-reachable input by the time it comes back to
 * us, so it is HMAC-signed here and verified before any redirect happens.
 * Without that, the endpoint would be an open redirect: anyone could send
 * `/t/click/anything?u=https://phishing.example` and launder a hostile link
 * through our domain's reputation.
 *
 * The signing key is derived from ENCRYPTION_KEY rather than being its own
 * env var — both the API and the worker already share ENCRYPTION_KEY (the
 * worker decrypts OAuth tokens the API encrypted), so deployments get link
 * signing for free. The derivation is domain-separated so this key can never
 * collide with the one used for token encryption.
 */
const SIGNING_DOMAIN = "believe.ai/link-signing/v1";

/** 16 bytes of HMAC is far beyond what a redirect guard needs to resist forgery. */
const SIGNATURE_HEX_LENGTH = 32;

/** Only ever redirect to real web links — never javascript:, data:, file:, etc. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function deriveSigningKey(encryptionKey: string): Buffer {
  return createHmac("sha256", Buffer.from(encryptionKey, "hex")).update(SIGNING_DOMAIN).digest();
}

/** Signature over the exact destination URL that will be handed to res.redirect. */
export function signTrackedUrl(url: string, encryptionKey: string): string {
  return createHmac("sha256", deriveSigningKey(encryptionKey))
    .update(url)
    .digest("hex")
    .slice(0, SIGNATURE_HEX_LENGTH);
}

/** Constant-time comparison — a leaky compare would let an attacker forge a signature byte by byte. */
export function verifyTrackedUrl(url: string, signature: string | undefined, encryptionKey: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signTrackedUrl(url, encryptionKey));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function isAllowedRedirectProtocol(url: string): boolean {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Minimal HTML entity decode for what actually shows up inside an href attribute. */
function decodeHref(href: string): string {
  return href
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

/** Re-escape for safe embedding back into a double-quoted href attribute. */
function encodeHref(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export interface RewriteLinksOptions {
  html: string;
  trackingToken: string;
  apiBaseUrl: string;
  encryptionKey: string;
  /** Links that must be left alone — notably the unsubscribe link, which must never be click-tracked. */
  skipUrls?: string[];
}

/**
 * Rewrites http(s) anchor targets to route through the click-tracking
 * endpoint. Anything else — mailto:, tel:, in-message anchors, and any URL in
 * `skipUrls` — is left exactly as authored.
 */
export function rewriteLinksForTracking({
  html,
  trackingToken,
  apiBaseUrl,
  encryptionKey,
  skipUrls = [],
}: RewriteLinksOptions): string {
  const skip = new Set(skipUrls);
  const base = apiBaseUrl.replace(/\/+$/, "");

  return html.replace(/(<a\b[^>]*?\bhref\s*=\s*)(["'])(.*?)\2/gi, (match, prefix: string, quote: string, rawHref: string) => {
    const destination = decodeHref(rawHref.trim());

    if (skip.has(destination) || !isAllowedRedirectProtocol(destination)) return match;
    // Don't double-wrap a link that already points at the tracking endpoint.
    if (destination.startsWith(`${base}/api/v1/t/`)) return match;

    const signature = signTrackedUrl(destination, encryptionKey);
    const tracked = `${base}/api/v1/t/click/${encodeURIComponent(trackingToken)}?u=${encodeURIComponent(
      destination,
    )}&s=${signature}`;

    return `${prefix}${quote}${encodeHref(tracked)}${quote}`;
  });
}
