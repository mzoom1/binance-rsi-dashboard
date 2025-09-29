import { memo } from "./cache";

const HOSTS = [
  process.env.NEXT_PUBLIC_BINANCE_BASE || "https://api.binance.com",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

// обгортка fetch з ретраями і ротацією
async function fetchWithRetry(urlPath: string, init?: RequestInit, maxTries = 4): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const host = HOSTS[attempt % HOSTS.length];
    try {
      const res = await fetch(host + urlPath, { ...init, next: { revalidate: 0 } });
      if (res.status === 429) {
        const ra = Number(res.headers.get("Retry-After") || "1");
        await new Promise(r => setTimeout(Math.min(ra, 5) * 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(await res.text());
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(300 * (attempt + 1) ** 2));
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

export async function listSpotSymbols(quote: string = "USDT") {
  return memo(`symbols-${quote}`, 1000 * 60 * 60 * 12, async () => {
    const res = await fetchWithRetry("/api/v3/exchangeInfo");
    const json = await res.json();
    return json.symbols.filter((s: any) => s.status === "TRADING" && (!quote || s.quoteAsset === quote));
  });
}

export async function getKlines(symbol: string, interval: string, limit: number = 500) {
  const key = `klines-${symbol}-${interval}-${limit}`;
  return memo(key, 60_000, async () => {
    const res = await fetchWithRetry(`/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const raw = await res.json();
    return raw.map((r: any) => ({
      time: r[0],
      open: parseFloat(r[1]),
      high: parseFloat(r[2]),
      low: parseFloat(r[3]),
      close: parseFloat(r[4]),
      volume: parseFloat(r[5])
    }));
  });
}
