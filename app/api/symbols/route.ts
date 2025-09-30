export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listSymbols } from '@/lib/binance';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quote = (searchParams.get('quote') || 'USDT') as 'USDT'|'USDC'|'BUSD'|'ALL';
  const market = (searchParams.get('market') || 'spot') as 'spot'|'futures';

  try {
    const syms = await listSymbols(market, quote);
    return NextResponse.json({ market, quote, count: syms.length, symbols: syms });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
