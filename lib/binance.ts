cat > lib/binance.ts <<'EOF'
import { memo } from "./cache";

const HOSTS = [
  process.env.NEXT_PUBLIC_BINANCE_BASE || "https://api.binance.com",
  "https://data-api.binance.vision",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchWithRetry(path: string, init?: RequestInit, tries = 5): Promise<Response> {
  let err: any;
  for (let i = 0; i < tries; i++) {
    const host = HOSTS[i % HOSTS.length];
    try {
      const res = await fetch(host + path, { ...init, cache: "no-store", next: { revalidate: 0 } });
      if (res.status === 429) { await sleep(500 * (i + 1)); continue; }
      if (!res.ok) throw new Error(await res.text());
      return res;
    } catch (e) {
      err = e; await sleep(300 * (i + 1) ** 2);
    }
  }
  throw err ?? new Error("fetch failed");
}

export type SpotSymbol = { symbol:string; baseAsset:string; quoteAsset:string };

export async function listSpotSymbols(quote: 'ALL'|'USDT'|'USDC'|'BUSD'='USDT'): Promise<SpotSymbol[]> {
  return memo(`symbols:${quote}`, 12*60*60*1000, async () => {
    const res = await fetchWithRetry("/api/v3/exchangeInfo");
    const json = await res.json();
    const allowed = quote === "ALL" ? new Set(["USDT","USDC","BUSD"]) : new Set([quote]);
    return (json.symbols || [])
      .filter((s:any)=> s.status==="TRADING" && s.isSpotTradingAllowed && allowed.has(s.quoteAsset))
      .map((s:any)=>({ symbol: s.symbol, baseAsset:s.baseAsset, quoteAsset:s.quoteAsset }));
  });
}

export async function getKlines(symbol: string, interval: string, limit = 500){
  const key = `klines:${symbol}:${interval}:${limit}`;
  return memo(key, 60_000, async () => {
    const res = await fetchWithRetry(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const arr = await res.json();
    return arr.map((k:any[])=>({ time:k[0], open:+k[1], high:+k[2], low:+k[3], close:+k[4], volume:+k[5], closeTime:k[6] }));
  });
}
EOF

git add lib/binance.ts
git commit -m "feat: use binance.vision mirror + host rotation"
git push