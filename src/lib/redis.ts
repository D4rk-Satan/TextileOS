import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Upstash Redis environment variables are missing. Caching will be disabled.');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

/**
 * Helper to handle Cache-Aside logic
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // default 5 mins
): Promise<T> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return await fetchFn();
  }

  try {
    const cached = await redis.get<string>(key);
    if (cached) {
      console.log(`[Redis] Cache HIT: ${key}`);
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    console.log(`[Redis] Cache MISS: ${key}`);
    const data = await fetchFn();
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return data;
  } catch (error) {
    console.error('[Redis] Error:', error);
    return await fetchFn();
  }
}

/**
 * Helper to invalidate cache keys by exact key or prefix
 */
export async function invalidateCache(patterns: string | string[]) {
  if (!pattern() || !process.env.UPSTASH_REDIS_REST_URL) return;
  
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  
  try {
    for (const pattern of patternList) {
      // Find all keys matching the prefix
      const keys = await redis.keys(`${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Redis] Invalidated ${keys.length} keys for pattern: ${pattern}*`);
      }
    }
  } catch (error) {
    console.error('[Redis] Invalidation Error:', error);
  }
}

function pattern() {
  return true;
}
