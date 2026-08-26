"""Generic paginated-list envelope — mirrors packages/shared's
PaginatedResult<T> and its DEFAULT_PAGE_SIZE/MAX_PAGE_SIZE constants."""

from __future__ import annotations

from pydantic import BaseModel

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


class PaginatedResult[T](BaseModel):
    items: list[T]
    page: int
    limit: int
    total: int
    totalPages: int


def safe_page(page: int) -> int:
    return max(1, page)


def safe_limit(limit: int) -> int:
    return min(MAX_PAGE_SIZE, max(1, limit))


def total_pages(total: int, limit: int) -> int:
    return max(1, -(-total // limit))  # ceil division without importing math
