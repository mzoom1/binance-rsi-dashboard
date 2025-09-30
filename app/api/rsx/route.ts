export const dynamic = "force-dynamic";
export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getKlines } from '@/lib/binance';
import { rsi } from '@/lib/rsi';

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const interval = searchParams.get('interval') || '1h';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 200), 50), 1000);
    const period = Math.min(Math.max(Number(searchParams.get('period') ?? 14), 2), 100);
    const market = (searchParams.get('market') || 'spot') as 'spot'|'futures';

    if (!symbol) return bad('symbol is required');
    if (!/^[A-Z0-9]{4,30}$/.test(symbol)) return bad('invalid symbol');
    if (!/^(1m|3m|5m|15m|30m|1h|2h|4h|6h|8h|12h|1d|3d|1w|1M)$/.test(interval)) return bad('invalid interval');

    const kl = await getKlines(market, symbol, interval, limit);
    if (!Array.isArray(kl) || kl.length === 0) return NextResponse.json([]);

    const closes = kl.map(k => k.close);
    const r = rsi(closes, period);
    const out = kl.map((k, i) => ({
      time: k.time,
      close: closes[i],
      rsi: Number.isFinite(r[i]) ? r[i] : null,
    }));

    return NextResponse.json(out);
  } catch (e: any) {
    console.error('rsx.error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
