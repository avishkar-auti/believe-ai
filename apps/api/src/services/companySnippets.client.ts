import { logger } from "../config/logger.js";

/**
 * Real public company-info lookup — no API key needed. Wikipedia's public
 * REST summary API (official, free, no scraping) plus the company's own
 * guessed homepage meta description. Deliberately does NOT scrape a search
 * engine's results page. Ported from HireConnect's search_client.py.
 */
const TIMEOUT_MS = 10_000;
const REQUEST_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BelieveAI/1.0)" };
const META_DESCRIPTION_RE = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i;

function guessDomain(company: string): string | null {
  const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned ? `${cleaned}.com` : null;
}

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWikipediaSummary(company: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(company)}`,
      REQUEST_HEADERS,
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { type?: string; extract?: string };
    // Disambiguation pages have no real "extract" worth trusting.
    if (data.type === "disambiguation") return null;
    return data.extract?.trim() || null;
  } catch (err) {
    logger.warn({ company, err }, "companySnippets: Wikipedia summary lookup failed");
    return null;
  }
}

async function fetchSiteMetaDescription(company: string): Promise<string | null> {
  const domain = guessDomain(company);
  if (!domain) return null;
  try {
    const res = await fetchWithTimeout(`https://${domain}`, REQUEST_HEADERS);
    if (!res.ok) return null;
    const html = await res.text();
    const match = META_DESCRIPTION_RE.exec(html);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Best-effort — never throws. Missing snippets just means company intel synthesis
 * downstream marks everything low-confidence rather than fabricating values. */
export async function fetchCompanySnippets(company: string): Promise<string[]> {
  const [wiki, siteDescription] = await Promise.all([fetchWikipediaSummary(company), fetchSiteMetaDescription(company)]);
  return [wiki, siteDescription].filter((s): s is string => Boolean(s));
}
