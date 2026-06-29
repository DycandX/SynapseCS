type RateLimitResult = { success: boolean; limit: number; remaining: number; reset: number };

let rateLimitImpl: (id: string) => Promise<RateLimitResult> = async () => ({
  success: true,
  limit: 999,
  remaining: 999,
  reset: 0,
});

const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

if (redisUrl && redisToken) {
  // When @upstash packages are installed:
  // const { Ratelimit } = await import("@upstash/ratelimit")
  // const { Redis } = await import("@upstash/redis")
  // const redis = new Redis({ url: redisUrl, token: redisToken })
  // const ratelimit = new Ratelimit({
  //   redis,
  //   limiter: Ratelimit.slidingWindow(10, "10s"),
  //   analytics: true,
  // })
  // rateLimitImpl = (id: string) => ratelimit.limit(id)
}

export const rateLimit = {
  limit: (id: string) => rateLimitImpl(id),
};
