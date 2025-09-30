export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { get24hTicker, listSymbols, getKlines, type Market } from '@/lib/binance';
import { rsi } from '@/lib/rsi';
import { getJSON, setJSON } from '@/lib/redis';

type Row = { symbol: string; price: number|null; rsi: number|null; change24h: number|null };
type Payload = { rows: Row[]; total: number; nextOffset: number|null; meta: any; ts: number };

function ttls(interval: string) {
  // свіжість і максимально допустимий вік
  if (['1m','3m','5m','15m','30m'].includes(interval)) return { fresh: 30, stale: 300 };
  if (['1h','2h','4h'].includes(interval)) return { fresh: 60, stale: 600 };
  return { fresh: 120, stale: 1200 };
}

async function computePage(market: Market, interval: string, quote: 'USDT'|'USDC'|'BUSD'|'ALL', offset: number, limit: number) {
  let syms = await listSymbols(market, quote);
  const total = syms.length;
  if (!Array.isArray(syms) || !total) {
    syms = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'].map(s => ({ symbol:s, baseAsset:'', quoteAsset:'USDT' }));
  }
  let slice = syms.slice(offset, offset + limit).map(s => s.symbol);
  if (slice.length === 0) slice = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'];

  const CONC = 8;
  let i = 0;
  const rows: Row[] = [];
  const errors: any[] = [];

  await Promise.all(Array.from({length:CONC}).map(async () => {
    while (i < slice.length) {
      const sym = slice[i++];
      try {
        const [kl, t24] = await Promise.all([
          getKlines(market, sym, interval, 200),
          get24hTicker(market, sym).catch(() => null),
        ]);
        if (!Array.isArray(kl) || kl.length === 0) throw new Error('empty klines');
        const closes = kl.map(k=>k.close);
        const rs = rsi(closes, 14);
        rows.push({
          symbol: sym,
          price: t24?.lastPrice ?? closes.at(-1) ?? null,
          rsi: Number.isFinite(rs.at(-1)!) ? rs.at(-1) : null,
          change24h: t24?.priceChangePercent ?? null,
        });
      } catch (e:any) {
        errors.push({ sym, msg:String(e?.message||e) });
      }
    }
  }));

  rows.sort((a,b)=> a.symbol.localeCompare(b.symbol));
  const nextOffset = offset + limit < total ? offset + limit : null;
  const meta = { ok: rows.length, fail: errors.length, offset, limit, total };
  if (errors.length) console.log('summary.partial', { interval, market, ...meta, sampleFail: errors[0] });
  return { rows, total, nextOffset, meta } as const;
}

export async function GET(req: Request) {
  const t0 = Date.now();
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get('interval') || '1h';
  const quote = (searchParams.get('quote') || 'USDT') as 'USDT'|'USDC'|'BUSD'|'ALL';
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));
  const limit = Math.min(500, Math.max(10, Number(searchParams.get('limit') ?? 200)));
  const market = (searchParams.get('market') || 'spot') as Market;

  const { fresh, stale } = ttls(interval);
  const key = `sum:${market}:${interval}:${quote}:${offset}:${limit}`;
  const now = Math.floor(Date.now()/1000);

  // 1) пробуємо віддати кеш
  const cached = await getJSON<Payload>(key);
  if (cached) {
    const age = now - (cached.ts || 0);
    if (age <= fresh) {
      // повністю свіжий
      return NextResponse.json({ rows: cached.rows, total: cached.total, nextOffset: cached.nextOffset, meta: { ...cached.meta, cached: true, age, tookMs: Date.now()-t0 } });
    }
    if (age <= stale) {
      // віддаємо застарілий і запускаємо фон-оновлення (fire-and-forget)
      (async () => {
        try {
          const freshData = await computePage(market, interval, quote, offset, limit);
          const payload: Payload = { ...freshData, ts: Math.floor(Date.now()/1000), meta: { ...freshData.meta, revalidated: true } };
          await setJSON(key, payload, stale);
        } catch (e) {}
      })();
      return NextResponse.json({ rows: cached.rows, total: cached.total, nextOffset: cached.nextOffset, meta: { ...cached.meta, cached: true, stale: true, age, tookMs: Date.now()-t0 } });
    }
    // інакше — кеш занадто старий, перерахуємо синхронно нижче
  }

  // 2) синхронний перерахунок і запис у Redis
  const calc = await computePage(market, interval, quote, offset, limit);
  const payload: Payload = { ...calc, ts: now, meta: { ...calc.meta, computed: true } };
  await setJSON(key, payload, stale);
  return NextResponse.json({ rows: payload.rows, total: payload.total, nextOffset: payload.nextOffset, meta: { ...payload.meta, cached:false, tookMs: Date.now()-t0 } });
}
