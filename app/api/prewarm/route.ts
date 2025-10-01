import { NextResponse } from 'next/server';
import { computeOne, MARKETS, QUOTES, ALL_INTERVALS } from '@/lib/binance';
import { SECRET } from '@/lib/secret';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  }

  const onlyInterval = searchParams.get('interval'); 
  const intervals = onlyInterval ? [onlyInterval] : ALL_INTERVALS;

  for (const market of MARKETS) {
    for (const quote of QUOTES) {
      for (const iv of intervals) {
        await computeOne(market, iv, quote);
      }
    }
  }

  return NextResponse.json({ ok:true, intervals, ts: Date.now() });
}
