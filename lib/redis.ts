type Json = any;

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_KV_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.VERCEL_KV_REST_TOKEN;

type Entry = { val: Json; exp: number };
const g = globalThis as any;
if (!g.__MEMO_CACHE__) g.__MEMO_CACHE__ = new Map<string, Entry>();
const MEMO: Map<string, Entry> = g.__MEMO_CACHE__;

async function upstashGet(key: string): Promise<Json|null> {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.result == null) return null;
    return JSON.parse(j.result);
  } catch {
    return null;
  }
}

async function upstashSet(key: string, val: Json, ttlSec: number): Promise<void> {
  if (!REST_URL || !REST_TOKEN) { return; }
  try {
    const body = JSON.stringify([`set`, key, JSON.stringify(val), 'EX', ttlSec]);
    await fetch(`${REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch {}
}

export async function getJSON<T = Json>(key: string): Promise<T|null> {
  const now = Date.now();
  // 1) Redis
  const fromRedis = await upstashGet(key);
  if (fromRedis != null) return fromRedis as T;

  // 2) In-memory fallback
  const e = MEMO.get(key);
  if (!e) return null;
  if (e.exp <= now) { MEMO.delete(key); return null; }
  return e.val as T;
}

export async function setJSON(key: string, val: Json, ttlSec: number): Promise<void> {
  const exp = Date.now() + ttlSec * 1000;
  // 1) Redis
  await upstashSet(key, val, ttlSec);
  // 2) In-memory fallback
  MEMO.set(key, { val, exp });
}
