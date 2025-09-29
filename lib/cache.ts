import { LRUCache } from 'lru-cache';


export const memoryCache = new LRUCache<string, any>({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24, // 1 day
});

export async function memo<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const hit = memoryCache.get(key) as T | undefined;
  if (hit !== undefined) return hit;
  const val = await loader();
  memoryCache.set(key, val, { ttl });
  return val;
}