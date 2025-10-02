import { NextResponse } from 'next/server';
import { getJSON, setJSON } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_KV_URL || null;
  const tok = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.VERCEL_KV_REST_TOKEN || null;

  let roundtrip = false;
  try {
    await setJSON('diag:test', { t: Date.now() }, 60);
    const r = await getJSON('diag:test');
    roundtrip = !!r;
  } catch {}

  return NextResponse.json({
    redisEnv: Boolean(url && tok),
    redisUrlPresent: Boolean(url),
    redisTokenPresent: Boolean(tok),
    roundtrip, // true = реально читаємо/пишемо у спільне сховище
  });
}
