export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listSpotSymbols } from '@/lib/binance';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quote = (searchParams.get('quote') || 'USDT').toUpperCase();
  if (!['USDT','USDC','BUSD','ALL'].includes(quote)) {
    return new NextResponse('Invalid quote', { status: 400 });
  }
  const symbols = await listSpotSymbols(quote as any);
  return NextResponse.json(symbols, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } });
}
