"""arq worker — replaces apps/worker's (Node/BullMQ) background job
processing, one queue at a time as each gets ported (Phase 4+).

Lives inside apps/ai-service for now rather than as its own top-level
directory: it needs nothing beyond what this service already has (Redis
config, logging, the Settings pattern), and the existing Node apps/worker is
still doing real production work until its queues are actually ported —
there's no "apps/worker" slot to move into yet. Extracting this into its own
deployable unit is a natural step once Phase 4 retires the Node worker, not
before.
"""
