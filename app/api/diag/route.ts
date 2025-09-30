export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const hosts = [
    process.env.NEXT_PUBLIC_BINANCE_BASE || 'https://api.binance.com',
    'https://data-api.binance.vision',
    'https://api1.binance.com',
    'https://api2.binance.com',
    'https://api3.binance.com',
  ];
  const out:any[] = [];
  for (const h of hosts) {
    try {
      const r = await fetch(h + '/api/v3/exchangeInfo', { cache:'no-store' });
      const j = await r.json();
      const syms = Array.isArray(j?.symbols) ? j.symbols : [];
      out.push({ host:h, ok:r.ok, status:r.status, count: syms.length, sample: syms[0]?.symbol ?? null });
    } catch (e:any) {
      out.push({ host:h, ok:false, error:String(e) });
    }
  }
  return NextResponse.json({ diag: out });
}
