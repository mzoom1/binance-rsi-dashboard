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
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get('interval') || '1h';
  const debug = searchParams.get('debug') === '1';

  const symbols = SEED; // <- фіксований список, щоб UI ожив
  const out:any[] = [];
  const errors:any[] = [];

  // обережна паралельність
  const CONC = 3;
  let i = 0;

  await Promise.all(Array.from({length:CONC}).map(async () => {
    while (i < symbols.length) {
      const sym = symbols[i++];
      try {
        // тягнемо klines обов'язково; ticker опціонально
        const kl = await getKlines(sym, interval, 200);
        if (!Array.isArray(kl) || kl.length === 0) {
          throw new Error('empty klines');
        }
        const closes = kl.map(k=>k.close);
        const rs = rsi(closes, 14);
        const lastRsi = Number.isFinite(rs.at(-1)!) ? rs.at(-1)! : null;

        let price: number | null = closes.at(-1) ?? null;
        let change24h: number | null = null;
        try {
          const t24 = await get24hTicker(sym);
          price = t24?.lastPrice ?? price;
          change24h = t24?.priceChangePercent ?? null;
        } catch (e:any) {
          // не падаємо якщо тикер недоступний
          errors.push({ sym, msg:'ticker fail', err:String(e?.message||e) });
        }

        out.push({ symbol: sym, price, rsi: lastRsi, change24h });
      } catch (e:any) {
        errors.push({ sym, msg:String(e?.message||e) });
      }
    }
  }));

  out.sort((a,b)=> a.symbol.localeCompare(b.symbol));
  const meta = { tookMs: Date.now()-t0, ok: out.length, fail: errors.length };

  // лог у рантаймі
  console.log('summary.result', { ...meta, sampleFail: errors[0] });

  if (debug) {
    return NextResponse.json({ meta, out, errors });
  }
  return NextResponse.json(out);
}
