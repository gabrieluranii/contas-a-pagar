// Rate limit in-memory. Limitações conhecidas:
// - Reseta em cada redeploy (ok para MVP)
// - Não compartilha entre instâncias serverless (ok — Vercel tende a reusar warm instances)
// - Para produção séria, trocar por Upstash Redis.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: MAX_REQUESTS - bucket.count };
}
