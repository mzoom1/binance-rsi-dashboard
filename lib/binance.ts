import { memo } from "./cache";

const HOSTS = [
  process.env.NEXT_PUBLIC_BINANCE_BASE || "https://api.binance.com",
  "https://data-api.binance.vision",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

const sleep = (ms:number)=>new Promise(r=>setTimeout(r, ms));

async function fetchWithRetry(path: string, init?: RequestInit, tries = 5): Promise<Response> {
  let last:any;
  for (let i=0;i<tries;i++){
    const host = HOSTS[i % HOSTS.length];
    try {
      const res = await fetch(host + path, { ...init, cache:'no-store', next:{ revalidate:0 } });
      if (res.status === 429) { await sleep(500*(i+1)); continue; }
      if (!res.ok) throw new Error(await res.text());
      // @ts-ignore
      (res as any).__host = host;
      return res;
    } catch(e){ last=e; await sleep(300*(i+1)**2); }
  }
  throw last ?? new Error('fetch failed');
}

export type SpotSymbol = { symbol:string; baseAsset:string; quoteAsset:string };

export async function listSpotSymbols(quote: 'ALL'|'USDT'|'USDC'|'BUSD'='USDT'): Promise<SpotSymbol[]> {
  return memo(`symbols:${quote}`, 12*60*60*1000, async () => {
    const res = await fetchWithRetry("/api/v3/exchangeInfo");
    const json = await res.json();
    let symbols: any[] = Array.isArray(json?.symbols) ? json.symbols : [];

    // Якщо symbols порожні — пробуємо ще одне джерело (24hr ticker)
    if (symbols.length === 0) {
      try {
        const r2 = await fetchWithRetry("/api/v3/ticker/24hr");
        const t = await r2.json();
        if (Array.isArray(t) && t.length) {
          symbols = t.map((x:any) => {
            const m = String(x.symbol).match(/^(.*?)(USDT|USDC|BUSD)$/);
            return m ? { symbol:x.symbol, baseAsset:m[1], quoteAsset:m[2] } : { symbol:x.symbol, baseAsset:x.symbol, quoteAsset:'' };
          });
        }
      } catch {}
    }

    const allowed = quote === "ALL" ? new Set(["USDT","USDC","BUSD"]) : new Set([quote]);

    // Мінімальний фільтр: тільки TRADING і потрібний quote
    return symbols
      .filter((s:any)=> (s.status ? s.status === "TRADING" : true))
      .filter((s:any)=> allowed.has(s.quoteAsset))
      .map((s:any)=>({ symbol:s.symbol, baseAsset:s.baseAsset, quoteAsset:s.quoteAsset }));
  });
}

export async function getKlines(symbol: string, interval: string, limit = 500){
  const key = `klines:${symbol}:${interval}:${limit}`;
  return memo(key, 60_000, async () => {
    const res = await fetchWithRetry(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const arr = await res.json();
    return (Array.isArray(arr)?arr:[]).map((k:any[])=>({
      openTime:k[0], time:k[0],
      open:+k[1], high:+k[2], low:+k[3], close:+k[4],
      volume:+k[5], closeTime:k[6]
    }));
  });
}

export async function get24hTicker(symbol: string){
  const key = `ticker24h:${symbol}`;
  return memo(key, 30_000, async () => {
    const res = await fetchWithRetry(`/api/v3/ticker/24hr?symbol=${symbol}`);
    const j = await res.json();
    return { symbol: j.symbol, lastPrice: +j.lastPrice, priceChangePercent: +j.priceChangePercent };
  });
}
