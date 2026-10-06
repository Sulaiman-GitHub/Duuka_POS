// Best-effort in-memory limiter (per server instance). Enough to blunt password guessing.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > max) return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}

export function clearRateLimit(key: string) {
  hits.delete(key);
}
