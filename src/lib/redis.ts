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
 * Helper to invalidate cache keys
 */
export async function invalidateCache(key: string | string[]) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  
  try {
    if (Array.isArray(key)) {
      await Promise.all(key.map(k => redis.del(k)));
      console.log(`[Redis] Invalidated keys: ${key.join(', ')}`);
    } else {
      await redis.del(key);
      console.log(`[Redis] Invalidated key: ${key}`);
    }
  } catch (error) {
    console.error('[Redis] Invalidation Error:', error);
  }
}
