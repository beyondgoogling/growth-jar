const globalForLimiter = globalThis as unknown as {
  __gjBuckets?: Map<string, number[]>;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  if (!globalForLimiter.__gjBuckets) globalForLimiter.__gjBuckets = new Map();
  const buckets = globalForLimiter.__gjBuckets;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}