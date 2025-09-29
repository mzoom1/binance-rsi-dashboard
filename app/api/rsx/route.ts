export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getKlines } from '@/lib/binance';
import { rsi } from '@/lib/rsi';
import { assertInterval, assertSymbol } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  const interval = (searchParams.get('interval') || '1h');
  const limit = Math.min(1000, Math.max(100, Number(searchParams.get('limit') || '500')));
  const period = Math.min(50, Math.max(2, Number(searchParams.get('period') || '14')));

  try {
    assertSymbol(symbol); assertInterval(interval);
  } catch (e:any) {
    return new NextResponse(e.message, { status: 400 });
  }

  try {
    const kl = await getKlines(symbol, interval as any, limit);
    const closes = kl.map(k => k.close);
    const r = rsi(closes, period);
    const out = kl.map((k, i) => ({ time: k.openTime, close: k.close, rsi: r[i] }));
    const ttl = interval === '1m' ? 30 : interval === '1h' ? 60 : 120;
    return NextResponse.json(out, { headers: { 'Cache-Control': `s-maxage=${ttl}` } });
  } catch (e:any) {
    const msg = e?.message || 'Failed';
    const status = /429|rate|limit/i.test(msg) ? 429 : 500;
    return new NextResponse(msg, { status });
  }
}
