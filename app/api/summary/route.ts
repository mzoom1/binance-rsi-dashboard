export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { get24hTicker, listSpotSymbols, getKlines } from '@/lib/binance';
import { rsi } from '@/lib/rsi';

const FALLBACK = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
  "DOGEUSDT","ADAUSDT","TRXUSDT","TONUSDT","LINKUSDT"
];

export async function GET(req: Request) {
  const t0 = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get('interval') || '1h';
    const quote = (searchParams.get('quote') || 'USDT') as 'USDT'|'USDC'|'BUSD'|'ALL';
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));
    const limit = Math.min(500, Math.max(10, Number(searchParams.get('limit') ?? 200)));

    // 1) символи
    let syms = await listSpotSymbols(quote);
    if (!Array.isArray(syms) || syms.length === 0) {
      syms = FALLBACK.map(s => ({ symbol: s, baseAsset: s.replace(/USDT$/,''), quoteAsset: 'USDT' }));
    }
    const total = syms.length;

    // 2) сторінка
    const slice = syms.slice(offset, offset + limit).map(s => s.symbol);

    // 3) конвеєр: обережна паралельність
    const CONC = 8;
    const rows:any[] = [];
    const errors:any[] = [];
    let i = 0;

    await Promise.all(Array.from({length:CONC}).map(async () => {
      while (i < slice.length) {
        const sym = slice[i++];
        try {
          const [kl, t24] = await Promise.all([
            getKlines(sym, interval, 200),
            get24hTicker(sym).catch(() => null), // не валимося, якщо тикер упав
          ]);
          if (!Array.isArray(kl) || kl.length === 0) throw new Error('empty klines');
          const closes = kl.map(k => k.close);
          const r = rsi(closes, 14);
          rows.push({
            symbol: sym,
            price: t24?.lastPrice ?? closes.at(-1) ?? null,
            rsi: Number.isFinite(r.at(-1)!) ? r.at(-1) : null,
            change24h: t24?.priceChangePercent ?? null,
          });
        } catch (e:any) {
          errors.push({ sym, msg: String(e?.message || e) });
        }
      }
    }));

    rows.sort((a,b)=> a.symbol.localeCompare(b.symbol));
    const nextOffset = offset + limit < total ? offset + limit : null;

    const meta = { tookMs: Date.now() - t0, ok: rows.length, fail: errors.length, offset, limit, total };
    if (errors.length) console.log('summary.partial', { ...meta, sampleFail: errors[0] });

    return NextResponse.json({ rows, total, nextOffset, meta });
  } catch (err:any) {
    console.error('summary.error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
