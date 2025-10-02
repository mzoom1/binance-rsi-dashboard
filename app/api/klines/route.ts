export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getKlines } from '@/lib/binance';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const interval = searchParams.get('interval') || '1h';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 200), 50), 1000);
    const market = (searchParams.get('market') || 'spot') as 'spot'|'futures';
    if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 });

    const kl = await getKlines(market, symbol, interval, limit);
    return NextResponse.json(kl);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
