export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listSymbols, getKlines, type Market } from '@/lib/binance';
import { intervals } from '@/lib/intervals';

// Прогрів кешу клайнсів по ринках
async function warmMarket(market: Market, iv: string) {
  const syms = await listSymbols(market, 'USDT'); // можна поставити 'ALL', але буде довше
  const top = syms.slice(0, 300).map(s => s.symbol); // обмежимося першими 300 для прогріву
  const CONC = 8;
  let i = 0;
  await Promise.all(Array.from({length: CONC}).map(async () => {
    while (i < top.length) {
      const sym = top[i++];
      try {
        await getKlines(market, sym, iv, 200);
      } catch {}
      await new Promise(r => setTimeout(r, 50));
    }
  }));
}

export async function GET() {
  try {
    const iv = intervals.includes('5m') ? '5m' : '1h';
    await warmMarket('spot', iv);
    await warmMarket('futures', iv);
    return NextResponse.json({ ok: true, warmed: { markets: ['spot','futures'], interval: iv } });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message || e) }, { status: 500 });
  }
}
