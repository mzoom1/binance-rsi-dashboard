import { NextResponse } from 'next/server';
import { getJSON } from '@/lib/redis';
import { Market } from '@/lib/binance';

type Row = { symbol: string; price: number|null; rsi: number|null; change24h: number|null };
type Payload = { rows: Row[]; total: number; nextOffset: number|null; meta: any; ts: number };

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get('interval') || '1h';
  const quote = (searchParams.get('quote') || 'USDT') as 'USDT'|'USDC'|'BUSD'|'ALL';
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));
  const limit = Math.min(500, Math.max(10, Number(searchParams.get('limit') ?? 200)));
  const market = (searchParams.get('market') || 'spot') as Market;

  const key = `sum:${market}:${interval}:${quote}:${offset}:${limit}`;
  const cached = await getJSON<Payload>(key);

  if (!cached) {
    return NextResponse.json({ ok:false, error:'no cached data' }, { status:503 });
  }

  return NextResponse.json({ 
    rows: cached.rows, 
    total: cached.total, 
    nextOffset: cached.nextOffset, 
    meta: { ...cached.meta, cached:true, ts: cached.ts } 
  });
}
