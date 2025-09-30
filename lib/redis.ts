import { Redis } from '@upstash/redis';

export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function getJSON<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return (await redis.get(key)) as T | null;
}
export async function setJSON<T>(key: string, value: T, ttlSec: number) {
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSec });
}
