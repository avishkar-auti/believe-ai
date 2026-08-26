"""External, non-AI news-source abstraction — same provider-flexibility
pattern as providers/ (swap NEWS_PROVIDER, no agent/graph code changes), but
for a plain data source rather than an AI model. NEWS_PROVIDER=mock
(default, zero keys) returns a curated dev/tech article pool — real enough
for the embedding-based retrieval/rerank pipeline to do genuine work end to
end. NEWS_PROVIDER=newsapi calls newsapi.org once a verified key is set.
"""

from __future__ import annotations

import random
from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

import httpx
from pydantic import BaseModel

from core.config import Settings


class RawArticle(BaseModel):
    title: str
    description: str | None = None
    url: str
    source: str
    published_at: str | None = None


class NewsSourceProvider(ABC):
    @abstractmethod
    async def fetch(self, query: str, page_size: int) -> list[RawArticle]: ...


_MOCK_POOL: dict[str, list[tuple[str, str]]] = {
    "devops": [
        ("Kubernetes 1.32 ships sidecar-less service mesh support", "New KEP graduates to stable, cutting sidecar overhead."),
        ("GitHub Actions adds native OIDC trust for GCP workload identity", "No more long-lived service account keys in CI."),
        ("Terraform vs OpenTofu: state of the fork one year in", "Community adoption and provider parity compared."),
        ("Prometheus 3.0 reworks remote write for lower cardinality costs", "Storage engine change targets high-cardinality metrics."),
        ("Helm 4 RC drops OCI-only chart distribution", "Chart museums are on the way out in favor of OCI registries."),
    ],
    "kubernetes": [
        ("Kubernetes 1.32 ships sidecar-less service mesh support", "New KEP graduates to stable, cutting sidecar overhead."),
        ("Helm 4 RC drops OCI-only chart distribution", "Chart museums are on the way out in favor of OCI registries."),
        ("kubelet memory manager gets per-pod overrides", "Fine-grained control lands for memory-sensitive workloads."),
    ],
    "react": [
        ("React Compiler reaches stable in the 20.x line", "Automatic memoization lands without opting into new hooks."),
        ("TanStack Query v6 simplifies suspense integration", "Fewer boilerplate hooks needed for streaming data."),
        ("Vite 7 cuts cold-start times with a rewritten dep pre-bundler", "Early benchmarks show large gains on big monorepos."),
    ],
    "machine learning": [
        ("Vertex AI adds managed reranking endpoints", "Google joins Cohere and NVIDIA in offering hosted rerank models."),
        ("Open-weight models close the gap on coding benchmarks", "Independent evals show narrowing spread across major suites."),
        ("Vector database vendors converge on hybrid search as the default", "Dense retrieval increasingly paired with keyword filters."),
    ],
    "general tech": [
        ("Big tech earnings: cloud capex hits record high", "AI infrastructure spend continues to outpace revenue growth."),
        ("Regulators finalize AI enforcement guidelines for 2026", "Compliance deadlines clarified for high-risk system providers."),
        ("TypeScript 6.0 beta brings faster incremental builds", "Go-based compiler port shows large build speed gains."),
        ("FastAPI hits 1.0 after years of beta", "API stabilizes dependency injection and background task internals."),
        ("Node.js 24 becomes the new active LTS", "Built-in permission model and V8 upgrades headline the release."),
    ],
}
_SOURCES = ["TechRadar", "InfraWeekly", "The New Stack", "DevOps Digest", "Believe Weekly"]


def _pick_bucket(query: str) -> list[tuple[str, str]]:
    key = (query or "general tech").lower()
    for needle, bucket in _MOCK_POOL.items():
        if needle in key or key in needle:
            return bucket
    seen: set[str] = set()
    deduped: list[tuple[str, str]] = []
    for bucket in _MOCK_POOL.values():
        for item in bucket:
            if item[0] not in seen:
                seen.add(item[0])
                deduped.append(item)
    return deduped


class MockNewsSourceProvider(NewsSourceProvider):
    async def fetch(self, query: str, page_size: int) -> list[RawArticle]:
        pool = _pick_bucket(query)
        shuffled = pool[:]
        random.shuffle(shuffled)
        now = datetime.now(UTC)
        return [
            RawArticle(
                title=title,
                description=description,
                url=f"https://example-news.believe.ai/articles/{abs(hash(title)) % 10_000}",
                source=_SOURCES[i % len(_SOURCES)],
                published_at=(now - timedelta(hours=i * 3)).isoformat(),
            )
            for i, (title, description) in enumerate(shuffled[:page_size])
        ]


class NewsApiOrgProvider(NewsSourceProvider):
    BASE_URL = "https://newsapi.org/v2/everything"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def fetch(self, query: str, page_size: int) -> list[RawArticle]:
        params: dict[str, str | int] = {"q": query, "pageSize": page_size, "sortBy": "publishedAt", "language": "en"}
        headers = {"X-Api-Key": self._api_key}
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(self.BASE_URL, params=params, headers=headers)
            res.raise_for_status()
            data = res.json()
        return [
            RawArticle(
                title=a["title"],
                description=a.get("description"),
                url=a["url"],
                source=(a.get("source") or {}).get("name", "Unknown"),
                published_at=a.get("publishedAt"),
            )
            for a in data.get("articles", [])
        ]


def get_news_source_provider(settings: Settings) -> NewsSourceProvider:
    if settings.news_provider == "newsapi":
        if not settings.news_api_key:
            raise RuntimeError("NEWS_PROVIDER=newsapi but NEWS_API_KEY is not set")
        return NewsApiOrgProvider(settings.news_api_key)
    return MockNewsSourceProvider()
