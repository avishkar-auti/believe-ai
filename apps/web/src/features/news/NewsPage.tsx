import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Box, Cloud, ExternalLink, Newspaper, Search } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { cn } from "../../lib/cn.js";
import { ApiError } from "../../lib/apiClient.js";
import { fetchNewsFeed, type NewsMode, type ScoredArticle } from "./newsApi.js";

const MODES: { value: NewsMode; label: string }[] = [
  { value: "resume", label: "My resume" },
  { value: "search", label: "Search" },
];

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsPage() {
  const [mode, setMode] = useState<NewsMode>("resume");
  const [query, setQuery] = useState("");

  const feedMutation = useMutation({
    mutationFn: (params: { mode: NewsMode; query?: string }) => fetchNewsFeed(params.mode, params.query),
  });

  useEffect(() => {
    if (mode === "resume") feedMutation.mutate({ mode: "resume" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    feedMutation.mutate({ mode: "search", query: query.trim() });
  }

  const errorMessage =
    feedMutation.error instanceof ApiError
      ? feedMutation.error.message
      : feedMutation.isError
        ? "Couldn't load the feed — try again in a moment."
        : null;

  const articleCount = feedMutation.data?.articles.length ?? 0;

  return (
    <div className="mx-auto max-w-content space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ink-200/80 pb-5 dark:border-ink-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
            Stay current
          </p>
          <h1 className="text-title font-semibold text-ink-900 dark:text-white">News</h1>
        </div>
        {!feedMutation.isPending && articleCount > 0 && (
          <p className="text-sm text-ink-400 dark:text-ink-500">
            {articleCount} {articleCount === 1 ? "story" : "stories"}
            {mode === "resume" ? " matched to your profile" : " found"}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-pill border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-800/60">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={cn(
                "rounded-pill px-4 py-1.5 text-sm font-medium transition-all duration-200",
                mode === m.value
                  ? "bg-ink-900 text-white shadow-sm dark:bg-white dark:text-ink-900"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative min-w-[240px] flex-1">
          <button
            type="submit"
            disabled={mode === "resume" || !query.trim() || feedMutation.isPending}
            aria-label="Search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-700 disabled:cursor-not-allowed disabled:hover:text-ink-400 dark:hover:text-ink-100"
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            placeholder={mode === "resume" ? "Switch to Search to look something up" : "Search topics, packages, companies…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={mode === "resume"}
            className="h-11 w-full rounded-pill border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ink-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:focus:border-ink-300"
          />
        </form>
      </div>

      {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

      {feedMutation.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/40" />
          ))}
        </div>
      ) : !feedMutation.data || feedMutation.data.articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description={
            mode === "resume"
              ? "Upload a resume to get a personalized feed, or switch to Search."
              : "Search for a topic to see articles."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feedMutation.data.articles.map((article) => (
            <ArticleCard key={article.url} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function articleIcon(article: ScoredArticle) {
  const haystack = `${article.title} ${article.description ?? ""}`.toLowerCase();
  if (/\bv?\d+\.\d+(\.\d+)?\b/.test(article.title) || /\b(npm|pypi|package|sdk|library)\b/.test(haystack)) {
    return Box;
  }
  if (/\b(cloud|aws|gcp|azure|datastore|kubernetes|server|infrastructure)\b/.test(haystack)) {
    return Cloud;
  }
  return Newspaper;
}

function ArticleCard({ article }: { article: ScoredArticle }) {
  const score = article.relevanceScore ?? article.embeddingScore;
  const published = timeAgo(article.publishedAt);
  const Icon = articleIcon(article);

  return (
    <div className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500/40">
      <div className="mb-4 flex items-start justify-between gap-2">
        {typeof score === "number" ? (
          <span className="inline-flex items-center rounded-pill bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-700 dark:text-ink-200">
            {Math.round(score * 100)}% match
          </span>
        ) : (
          <span />
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white dark:bg-white dark:text-ink-900">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <h3 className="mb-1.5 text-sm font-semibold leading-snug text-ink-900 dark:text-white">{article.title}</h3>
      {article.description && (
        <p className="line-clamp-3 text-xs leading-5 text-ink-500 dark:text-ink-400">{article.description}</p>
      )}

      <div className="mt-4 border-t border-ink-100 pt-3 dark:border-ink-700">
        <div className="flex items-center justify-between gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
          >
            Read story
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <span className="truncate text-xs text-ink-400 dark:text-ink-500">
            {article.source}
            {published && <span className="text-ink-300 dark:text-ink-600"> · {published}</span>}
          </span>
        </div>

        {article.whyRelevant && (
          <p className="mt-3 border-l-2 border-lime-500 pl-2.5 text-xs text-lime-700 dark:text-lime-400">
            {article.whyRelevant}
          </p>
        )}
      </div>
    </div>
  );
}
