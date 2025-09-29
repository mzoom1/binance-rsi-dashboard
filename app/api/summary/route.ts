export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { get24hTicker, listSpotSymbols, getKlines } from '@/lib/binance';
import { rsi } from '@/lib/rsi';
import { Interval } from '@/lib/intervals';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const interval = (searchParams.get('interval') || '1h') as Interval;
  const quote = (searchParams.get('quote') || 'USDT').toUpperCase() as any;

  const symbols = (await listSpotSymbols(quote)).map(s => s.symbol);
  const top = symbols.slice(0, 600);

  const tickers = await get24hTicker(top);

  const size = 12; const results: any[] = [];
  for (let i=0;i<top.length;i+=size) {
    const batch = top.slice(i,i+size);
    const chunk = await Promise.all(batch.map(async (sym) => {
      try {
        const kl = await getKlines(sym, interval, 200);
        const closes = kl.map(k=>k.close);
        const r = rsi(closes, 14);
        const lastRsi = r.at(-1) ?? null;
        const t = tickers[sym];
        return { symbol: sym, price: t?.lastPrice ?? closes.at(-1) ?? null, rsi: lastRsi, change24h: t?.priceChangePercent ?? 0 };
      } catch {
        const t = tickers[sym];
        return { symbol: sym, price: t?.lastPrice ?? null, rsi: null, change24h: t?.priceChangePercent ?? 0 };
      }
    }));
    results.push(...chunk);
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 's-maxage=60' } });
}
