export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { get24hTicker, getKlines } from '@/lib/binance';
import { rsi } from '@/lib/rsi';

const SEED = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
  "DOGEUSDT","ADAUSDT","TRXUSDT","TONUSDT","LINKUSDT"
];

export async function GET(req: Request) {
  const t0 = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get('interval') || '1h';

    const symbols = SEED;
    const out:any[] = [];
    const errors:any[] = [];

    const CONC = 5;
    let i = 0;
    await Promise.all(Array.from({length:CONC}).map(async () => {
      while (i < symbols.length) {
        const sym = symbols[i++];
        try {
          const [kl, t24] = await Promise.all([
            getKlines(sym, interval, 200),
            get24hTicker(sym),
          ]);
          if (!Array.isArray(kl) || kl.length === 0) throw new Error('empty klines');
          const closes = kl.map(k=>k.close);
          const rs = rsi(closes, 14);
          out.push({
            symbol: sym,
            price: t24?.lastPrice ?? closes.at(-1) ?? null,
            rsi: Number.isFinite(rs.at(-1)!) ? rs.at(-1) : null,
            change24h: t24?.priceChangePercent ?? null,
          });
        } catch (e:any) {
          errors.push({ sym, msg: String(e?.message || e) });
        }
      }
    }));

    out.sort((a,b)=> a.symbol.localeCompare(b.symbol));
    console.log('summary.ok', { tookMs: Date.now()-t0, ok: out.length, fail: errors.length, sampleFail: errors[0] });

    return NextResponse.json(out);
  } catch (err:any) {
    console.error('summary.error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
