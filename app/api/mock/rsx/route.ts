import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase();
  const interval = searchParams.get('interval') || '1h';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 120), 50), 500);

  // generate pseudo-random RSI series between 20..80 with some noise
  const out: { time: number; rsi: number }[] = [];
  const now = Date.now();
  const ivMap: Record<string, number> = { '1m': 60e3, '5m': 5*60e3, '15m': 15*60e3, '1h': 60*60e3, '4h': 4*60*60e3, '1d': 24*60*60e3, '1w': 7*24*60*60e3, '1M': 30*24*60*60e3 };
  const step = ivMap[interval] ?? 60*60e3;
  let val = 50;
  for (let i = limit - 1; i >= 0; i--) {
    const t = now - i * step;
    const drift = Math.sin((i + symbol.length) / 7) * 5;
    const noise = ((i * 9301 + 49297) % 233280) / 233280 * 8 - 4;
    val = Math.max(10, Math.min(90, val + drift * 0.1 + noise * 0.6));
    out.push({ time: t, rsi: Math.round(val * 100) / 100 });
  }

  return NextResponse.json(out);
}
