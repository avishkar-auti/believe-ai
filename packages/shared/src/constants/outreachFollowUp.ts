// Ported from HireConnect's outreach_execution_config.py. Shared between
// apps/api (schedules follow-ups after a send) and apps/worker (schedules
// the next one after each fires) so the cap can't drift between the two.
export const MAX_FOLLOW_UPS = 3;
export const FOLLOW_UP_DAYS = [3, 7, 14] as const;
