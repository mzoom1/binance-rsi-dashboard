import LRUCache from 'lru-cache';

export type Market = 'spot' | 'futures';

type Kline = {
  openTime: number;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

const cache = new LRUCache<string, any>({ max: 2000, ttl: 60_000 });

function bases(market: Market) {
  if (market === 'futures') {
    const base = process.env.NEXT_PUBLIC_BINANCE_FAPI_BASE || 'https://fapi.binance.com';
    return [base, 'https://fapi1.binance.com', 'https://fapi2.binance.com', 'https://fapi3.binance.com'];
  }
  const base = process.env.NEXT_PUBLIC_BINANCE_BASE || 'https://api.binance.com';
  return [base, 'https://api1.binance.com', 'https://api2.binance.com', 'https://api3.binance.com', 'https://data-api.binance.vision'];
}

function apiPrefix(market: Market) {
  return market === 'futures' ? '/fapi/v1' : '/api/v3';
}

async function fetchWithRetryRaw(urls: string[], path: string, init?: RequestInit, attempts = 3) {
  let lastErr: any;
  for (let i = 0; i < Math.min(attempts, urls.length); i++) {
    const u = urls[i] + path;
    try {
      const r = await fetch(u, { ...init, next: { revalidate: 0 } as any });
      if (r.ok) return r;
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  const val = await fn();
  cache.set(key, val, { ttl: ttlMs });
  return val;
}

/** Універсальний список символів (spot або USDT-perpetual futures) */
export async function listSymbols(
  market: Market,
  quote: 'USDT' | 'USDC' | 'BUSD' | 'ALL' = 'USDT',
): Promise<{ symbol: string; baseAsset: string; quoteAsset: string }[]> {
  const key = `symbols:${market}:${quote}`;
  return memo(key, 12 * 60 * 60 * 1000, async () => {
    const bs = bases(market);
    const pref = apiPrefix(market);
    const res = await fetchWithRetryRaw(bs, `${pref}/exchangeInfo`, { cache: 'no-store' });
    const j = await res.json();
    const arr = Array.isArray(j?.symbols) ? j.symbols : [];

    if (market === 'futures') {
      return arr
        .filter((s: any) => s.status === 'TRADING' && s.contractType === 'PERPETUAL')
        .filter((s: any) => (quote === 'ALL' ? true : s.quoteAsset === quote))
        .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
    }

    return arr
      .filter((s: any) => s.status === 'TRADING')
      .filter((s: any) => (quote === 'ALL' ? true : s.quoteAsset === quote))
      .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
  });
}

/** Klines: (market, symbol, interval, limit?) */
export async function getKlines(
  market: Market,
  symbol: string,
  interval: string,
  limit: number = 200,
): Promise<Kline[]> {
  const key = `klines:${market}:${symbol}:${interval}:${limit}`;
  return memo(key, 60_000, async () => {
    const bs = bases(market);
    const pref = apiPrefix(market);
    const res = await fetchWithRetryRaw(bs, `${pref}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const arr = await res.json();
    return (Array.isArray(arr) ? arr : []).map((k: any[]) => ({
      openTime: k[0],
      time: k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5],
      closeTime: k[6],
    }));
  });
}

/** 24h тикер: (market, symbol) */
export async function get24hTicker(market: Market, symbol: string) {
  const key = `ticker24h:${market}:${symbol}`;
  return memo(key, 30_000, async () => {
    const bs = bases(market);
    const pref = apiPrefix(market);
    const res = await fetchWithRetryRaw(bs, `${pref}/ticker/24hr?symbol=${symbol}`);
    const j = await res.json();
    return { symbol: j.symbol, lastPrice: +j.lastPrice, priceChangePercent: +j.priceChangePercent };
  });
}

export type { Kline };
