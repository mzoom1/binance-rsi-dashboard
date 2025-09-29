import { memo, memoryCache } from './cache';
import { intervalTtl, Interval } from './intervals';
import { delay } from './utils';

const BASE = process.env.NEXT_PUBLIC_BINANCE_BASE || 'https://api.binance.com';
const RSI_SOURCE = process.env.RSI_SOURCE || 'local';

async function fetchWithRetry(url: string, init?: RequestInit, maxTries = 4): Promise<Response> {
  let attempt = 0; let lastErr: any;
  while (attempt < maxTries) {
    try {
      const res = await fetch(url, { ...init, next: { revalidate: 0 } });
      if (res.status === 429) {
        const ra = Number(res.headers.get('Retry-After') || '1');
        await delay(Math.min(ra, 5) * 1000 * (attempt + 1));
        attempt++; continue;
      }
      if (!res.ok) throw new Error(await res.text());
      return res;
    } catch (e) {
      lastErr = e; attempt++; await delay(250 * attempt * attempt);
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

export type SpotSymbol = { symbol: string; baseAsset: string; quoteAsset: string };

export async function listSpotSymbols(quote: 'ALL'|'USDT'|'USDC'|'BUSD' = 'USDT'): Promise<SpotSymbol[]> {
  return memo(`symbols:${quote}`, 12*60*60*1000, async () => {
    if (process.env.MOCK === 'true') {
      const data = await import('./mock/exchangeInfo.json');
      return filterSymbols(data.default, quote);
    }
    const res = await fetchWithRetry(`${BASE}/api/v3/exchangeInfo`);
    const json = await res.json();
    return filterSymbols(json, quote);
  });
}

function filterSymbols(json: any, quote: 'ALL'|'USDT'|'USDC'|'BUSD'): SpotSymbol[] {
  const allowedQuotes = quote === 'ALL' ? new Set(['USDT','USDC','BUSD']) : new Set([quote]);
  return (json.symbols || [])
    .filter((s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed && allowedQuotes.has(s.quoteAsset))
    .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
}

export type Kline = { openTime:number; open:number; high:number; low:number; close:number; volume:number; closeTime:number };

export async function getKlines(symbol: string, interval: Interval, limit = 500): Promise<Kline[]> {
  const key = `klines:${symbol}:${interval}:${limit}`;
  const ttl = intervalTtl(interval);
  return memo(key, ttl, async () => {
    if (process.env.MOCK === 'true' && symbol === 'BTCUSDT' && interval === '1h') {
      const data = await import('./mock/klines_BTCUSDT_1h.json');
      return data.default as Kline[];
    }
    const url = `${BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetchWithRetry(url);
    const arr = await res.json();
    return arr.map((k: any[]) => ({
      openTime: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5], closeTime: k[6]
    }));
  });
}

export async function get24hTicker(symbols: string[]): Promise<Record<string, { lastPrice:number; priceChangePercent:number }>> {
  const out: Record<string, { lastPrice:number; priceChangePercent:number }> = {};
  const chunks: string[][] = [];
  const size = 15;
  for (let i=0;i<symbols.length;i+=size) chunks.push(symbols.slice(i,i+size));
  await Promise.all(chunks.map(async (chunk, idx) => {
    await delay(50*idx);
    await Promise.all(chunk.map(async (sym) => {
      const key = `24h:${sym}`;
      const cached = memoryCache.get(key);
      if (cached) { out[sym] = cached as any; return; }
      const res = await fetchWithRetry(`${BASE}/api/v3/ticker/24hr?symbol=${sym}`);
      const j = await res.json();
      const val = { lastPrice: Number(j.lastPrice), priceChangePercent: Number(j.priceChangePercent) };
      memoryCache.set(key, val, { ttl: 60_000 });
      out[sym] = val;
    }))
  }))
  return out;
}
