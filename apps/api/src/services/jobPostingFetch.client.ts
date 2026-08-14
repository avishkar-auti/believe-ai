import dnsPromises from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import * as cheerio from "cheerio";
import { logger } from "../config/logger.js";
import { ValidationError } from "../errors/AppError.js";

/**
 * SSRF guard: the job URL is fully user-controlled and fetched from this
 * server, so without this check a user could point it at
 * http://localhost:4000/... or a cloud metadata endpoint
 * (169.254.169.254) and have the server fetch internal resources on their
 * behalf. Ported from HireConnect's job_posting_client.py.
 */
export class UnsafeJobUrlError extends ValidationError {}

const REQUEST_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BelieveAI/1.0)" };
const TIMEOUT_MS = 15_000;
const ALLOWED_SCHEMES = new Set(["http:", "https:"]);
const MAX_REDIRECTS = 5;
// Below this, a fetch is treated as "didn't actually get the posting" rather than "the
// posting happens to be short" — well above a bare <title> shell page, well below a real posting.
const MIN_SUBSTANTIAL_CHARS = 200;

const WORKDAY_HOST_RE = /^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/i;

function isPublicIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return false; // 10.0.0.0/8
  if (a === 127) return false; // loopback
  if (a === 0) return false; // "this network"
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT 100.64.0.0/10
  if (a === 169 && b === 254) return false; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
  if (a === 192 && b === 168) return false; // 192.168.0.0/16
  if (a >= 224) return false; // multicast + reserved
  return true;
}

function isPublicIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return false; // loopback
  if (lower.startsWith("fe80:") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return false; // link-local fe80::/10
  if (lower.startsWith("fc") || lower.startsWith("fd")) return false; // unique local fc00::/7
  if (lower.startsWith("::ffff:")) return isPublicIpv4(lower.slice(7)); // IPv4-mapped
  return true;
}

async function assertFetchableUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeJobUrlError("That doesn't look like a valid link. Please paste the full job posting URL.");
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new UnsafeJobUrlError("Job posting links must start with http:// or https://. Please paste the full URL.");
  }
  if (!parsed.hostname) {
    throw new UnsafeJobUrlError("That link is missing a website address. Please paste the full job posting URL.");
  }

  let addresses: LookupAddress[];
  try {
    addresses = await dnsPromises.lookup(parsed.hostname, { all: true });
  } catch {
    throw new UnsafeJobUrlError(
      "We couldn't find that website. Check the link for typos, or paste the job description text instead.",
    );
  }

  for (const { address, family } of addresses) {
    const isPublic = family === 4 ? isPublicIpv4(address) : isPublicIpv6(address);
    if (!isPublic) {
      logger.warn({ host: parsed.hostname, address }, "jobPostingFetch: blocked non-public host");
      throw new UnsafeJobUrlError("That link points to a private address, so we can't open it.");
    }
  }
}

/** requests follows redirects itself in most clients, but that would bypass the SSRF check —
 * redirects are followed manually here, re-validating before each hop. */
async function fetchWithRedirectGuard(url: string, headers: Record<string, string>): Promise<Response> {
  let current = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    await assertFetchableUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, { headers, redirect: "manual", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (res.status < 300 || res.status >= 400) return res;
    const location = res.headers.get("location");
    if (!location) return res;
    current = new URL(location, current).toString();
  }
  throw new UnsafeJobUrlError("That link redirected too many times. Try the posting's direct URL.");
}

function isSubstantial(text: string): boolean {
  return text.length >= MIN_SUBSTANTIAL_CHARS;
}

function htmlFragmentToText(html: string | null | undefined): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $.root().text().replace(/\s+/g, " ").trim();
}

/** Flattens a whole career page, keeping the <title> as its own first line — the single
 * most reliable role/company signal on the page ("<Role> at <Company>", "<Role> | <Company>"). */
function pageHtmlToText(html: string): string {
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || "").replace(/\s+/g, " ").trim();
  $("script, style, noscript, nav, header, footer, form, aside, svg").remove();
  const main = $("main").first().length ? $("main").first() : $('[role="main"]').first().length ? $('[role="main"]').first() : $("body");
  const bodyText = main.text().replace(/\s+/g, " ").trim();
  return [title, bodyText].filter(Boolean).join("\n");
}

async function fetchWorkday(scheme: string, host: string, path: string, tenant: string): Promise<string> {
  const apiUrl = `${scheme}//${host}/wday/cxs/${tenant}${path}`;
  try {
    const res = await fetchWithRedirectGuard(apiUrl, { ...REQUEST_HEADERS, Accept: "application/json" });
    if (!res.ok) return "";
    const data = (await res.json()) as { jobPostingInfo?: { title?: string; location?: string; locationsText?: string; jobDescription?: string } };
    const info = data.jobPostingInfo ?? {};
    const title = info.title ?? "";
    const location = info.location ?? info.locationsText ?? "";
    const description = htmlFragmentToText(info.jobDescription);
    return [title, location, description].filter(Boolean).join("\n").trim();
  } catch (err) {
    if (err instanceof UnsafeJobUrlError) throw err;
    return "";
  }
}

async function fetchGenericHtml(jobUrl: string): Promise<string> {
  try {
    const res = await fetchWithRedirectGuard(jobUrl, REQUEST_HEADERS);
    if (!res.ok) {
      logger.info({ jobUrl, status: res.status }, "jobPostingFetch: HTTP fetch failed");
      return "";
    }
    return pageHtmlToText(await res.text());
  } catch (err) {
    if (err instanceof UnsafeJobUrlError) throw err;
    logger.info({ jobUrl, err }, "jobPostingFetch: HTTP fetch errored");
    return "";
  }
}

/**
 * Fetches the raw text of a job posting. Two paths, tried in order (a
 * headless-browser third tier exists in the reference implementation for
 * fully client-rendered pages, deliberately not ported here — it needs a
 * bundled Chromium install, which is a meaningfully heavier deployment
 * footprint than this feature currently warrants):
 * 1. Workday-hosted postings — calls the same public JSON API the page's
 *    own frontend uses to render.
 * 2. Plain HTTP GET + HTML text extraction — works for most non-SPA career
 *    pages (Greenhouse, Lever, most company career pages).
 */
export async function fetchJobPostingText(jobUrl: string): Promise<string> {
  await assertFetchableUrl(jobUrl);
  const parsed = new URL(jobUrl);

  let bestSoFar = "";

  const workdayMatch = WORKDAY_HOST_RE.exec(parsed.hostname);
  if (workdayMatch) {
    const text = await fetchWorkday(parsed.protocol, parsed.host, parsed.pathname, workdayMatch[1]!);
    if (isSubstantial(text)) return text;
    if (text.length > bestSoFar.length) bestSoFar = text;
  }

  const text = await fetchGenericHtml(jobUrl);
  if (isSubstantial(text)) return text;
  if (text.length > bestSoFar.length) bestSoFar = text;

  return bestSoFar;
}
