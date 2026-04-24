// Rate limit in-memory. Limitações conhecidas:
// - Reseta em cada redeploy (ok para MVP)
// - Não compartilha entre instâncias serverless (ok — Vercel tende a reusar warm instances)
// - Para produção séria, trocar por Upstash Redis.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_REQUESTS = 20;

const buckets = new Map(); // key -> { count, resetAt }

export function checkRateLimit(key) {
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
