export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listSymbols, getKlines, get24hTicker, type Market } from '@/lib/binance';
import { rsi } from '@/lib/rsi';
import { setJSON } from '@/lib/redis';

const SECRET = process.env.PREWARM_SECRET!;

const ALL_INTERVALS = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'] as const;
const QUOTES: Array<'USDT'> = ['USDT'];               // за потреби: 'USDC' | 'BUSD'
const MARKETS: Market[] = ['spot','futures'];

type Row = { symbol: string; price: number|null; rsi: number|null; change24h: number|null };
type Payload = { rows: Row[]; total: number; ts: number; meta: any };

async function computeOne(market: Market, interval: string, quote: 'USDT') {
  const syms = await listSymbols(market, quote); // [{symbol},...]
  const slice = syms.map(s => s.symbol);
  const CONC = 8;

  let i = 0;
  const rows: Row[] = [];
  await Promise.all(Array.from({length:CONC}).map(async () => {
    while (i < slice.length) {
      const sym = slice[i++];
      try {
        const [kl, t24] = await Promise.all([
          getKlines(market, sym, interval, 200),
          get24hTicker(market, sym).catch(()=>null),
        ]);
        if (!Array.isArray(kl) || kl.length === 0) continue;
        const closes = kl.map(k => k.close);
        const rs = rsi(closes, 14);
        rows.push({
          symbol: sym,
          price: t24?.lastPrice ?? closes.at(-1) ?? null,
          rsi: Number.isFinite(rs.at(-1)!) ? rs.at(-1) : null,
          change24h: t24?.priceChangePercent ?? null,
        });
      } catch {}
    }
  }));

  rows.sort((a,b)=> a.symbol.localeCompare(b.symbol));
  const payload: Payload = {
    rows, total: rows.length, ts: Math.floor(Date.now()/1000),
    meta: { market, interval, quote }
  };
  const key = `sum:${market}:${interval}:${quote}`;
  // TTL 90 секунд: завжди є свіжий кеш; навіть якщо одне оновлення пропуститься — клієнт не відчує
  await setJSON(key, payload, 90);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!SECRET || token !== SECRET) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });

  // Можна викликати для всього за раз
  const onlyInterval = searchParams.get('interval'); // опц.: prewarm?interval=5m
  const intervals = onlyInterval ? [onlyInterval] : ALL_INTERVALS;

  for (const market of MARKETS) {
    for (const quote of QUOTES) {
      // Стратегія: не валимо все паралельно, аби не впертись у ліміти — робимо по інтервалу
      for (const iv of intervals) {
        await computeOne(market, iv, quote);
      }
    }
  }
  return NextResponse.json({ ok:true, intervals, ts: Date.now() });
}