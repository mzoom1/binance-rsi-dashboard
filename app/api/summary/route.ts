export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getJSON } from '@/lib/redis';
import type { Market } from '@/lib/binance';

type Payload = { rows: any[]; total: number; ts: number; meta: any };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const market = (searchParams.get('market') || 'spot') as Market;
  const interval = searchParams.get('interval') || '15m';
  const quote = (searchParams.get('quote') || 'USDT') as 'USDT';

  const key = `sum:${market}:${interval}:${quote}`;
  const cached = await getJSON<Payload>(key);

  if (cached) {
    return NextResponse.json({ ...cached, meta: { ...cached.meta, cached:true } });
  }
  // якщо вперше — повертаємо порожню відповідь, UI показує "prewarming..."
  return NextResponse.json({
    rows: [], total: 0, ts: Math.floor(Date.now()/1000),
    meta: { market, interval, quote, cached:false, prewarming:true }
  });
}