import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const interval = searchParams.get('interval') || '1h';

  const coins = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'];
  const rows = coins.map((symbol, i) => {
    const seed = symbol.length + interval.length + i;
    const rand = (min:number, max:number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max-min);
    const rsi = Math.round(rand(20, 80) * 100) / 100;
    const price = Math.round(rand(0.5, 70000) * 100) / 100;
    const change24h = Math.round(rand(-10, 10) * 100) / 100;
    return { symbol, price, rsi, change24h };
  });

  return NextResponse.json({ rows, total: rows.length, nextOffset: null, meta: { mock: true } });
}
