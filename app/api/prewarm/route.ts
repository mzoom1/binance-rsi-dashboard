// app/api/prewarm/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import type { Market } from '@/lib/binance';
import { intervals as ALL_INTERVALS } from '@/lib/intervals';
import { SECRET } from '@/lib/secret';

const MARKETS: Market[] = ['spot', 'futures'];
// якщо хочеш ще, додай сюди 'USDC', 'BUSD', 'ALL'
const QUOTES = ['USDT'] as const;

function getBaseUrl(req: Request) {
  return process.env.APP_BASE_URL ?? new URL(req.url).origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';

  if (!SECRET || token !== SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const base = getBaseUrl(req);

  // сформуємо задачі прогріву: виклики /api/summary
  const tasks: Promise<unknown>[] = [];
  for (const market of MARKETS) {
    for (const iv of ALL_INTERVALS) {
      for (const quote of QUOTES) {
        const u =
          `${base}/api/summary?market=${market}` +
          `&interval=${iv}&quote=${quote}&offset=0&limit=200`;
        tasks.push(
          fetch(u, { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
            return r.json();
          })
        );
      }
    }
  }

  const settled = await Promise.allSettled(tasks);
  const okCount = settled.filter(s => s.status === 'fulfilled').length;
  const failCount = settled.length - okCount;

  return NextResponse.json({
    ok: true,
    requested: settled.length,
    okCount,
    failCount,
  });
}