import { listSymbols, getKlines, type Market } from '@/lib/binance';

// простий таймерний прогрів (використовуй лише локально або з cron)
export async function prewarmOnce(market: Market, interval: string) {
  const syms = await listSymbols(market, 'USDT');
  const names = syms.slice(0, 200).map(s => s.symbol);
  let i = 0;
  const CONC = 6;
  await Promise.all(Array.from({length: CONC}).map(async () => {
    while (i < names.length) {
      const s = names[i++];
      try { await getKlines(market, s, interval, 200); } catch {}
      await new Promise(r => setTimeout(r, 60));
    }
  }));
}
