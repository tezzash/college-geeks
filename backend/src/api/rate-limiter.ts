type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Too many requests. Please try again later.');
    this.name = 'RateLimitError';
  }
}

/** Simple process-local limiter for the single-server alpha deployment. */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly rules: Record<string, RateLimitRule>) {}

  check(scope: string, key: string): void {
    const rule = this.rules[scope];
    if (!rule) return;

    const now = Date.now();
    const bucketKey = `${scope}:${key}`;
    const current = this.buckets.get(bucketKey);
    if (!current || current.resetAt <= now) {
      this.buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
      return;
    }

    if (current.count >= rule.limit) {
      throw new RateLimitError(Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
    }

    current.count += 1;
  }

  cleanup(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
