// lib/binance.ts
import { memo } from "./cache";

/**
 * Хости для фетчів. Перший береться з ENV, далі — офіційні дзеркала.
 * Ми автоматично ротируємо по списку і робимо ретраї.
 */
const HOSTS = [
  process.env.NEXT_PUBLIC_BINANCE_BASE || "https://api.binance.com",
  "https://data-api.binance.vision",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Обгортка fetch з ротацією хостів + експоненційним бекофом.
 * Використовуємо cache: "no-store", щоб не втручався Next revalidate,
 * а мемо-кеш/Redis накладаємо поверх у memo().
 */
async function fetchWithRetry(
  path: string,
  init?: RequestInit,
  tries = 5
): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    const host = HOSTS[i % HOSTS.length];
    try {
      const res = await fetch(host + path, {
        ...init,
        cache: "no-store",
        next: { revalidate: 0 },
      });

      // 429 — ліміти. Трохи чекаємо і пробуємо інший хост/ще раз.
      if (res.status === 429) {
        await sleep(600 * (i + 1));
        continue;
      }

      if (!res.ok) {
        // Пробуємо прочитати текст помилки, щоб зберегти в лог.
        let msg = "";
        try {
          msg = await res.text();
        } catch {}
        throw new Error(
          `HTTP ${res.status} on ${host}${path}` + (msg ? `: ${msg}` : "")
        );
      }

      return res;
    } catch (e) {
      lastErr = e;
      // експоненційний бекоф між спробами
      await sleep(300 * (i + 1) ** 2);
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

/** Тип для символів */
export type SpotSymbol = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

/**
 * Список спотових символів (TRADING). За замовчуванням — тільки USDT.
 * Кеш: 12 год у нашому memo-кеші/Redis (поверх fetch).
 */
export async function listSpotSymbols(
  quote: "ALL" | "USDT" | "USDC" | "BUSD" = "USDT"
): Promise<SpotSymbol[]> {
  return memo(`symbols:${quote}`, 12 * 60 * 60 * 1000, async () => {
    const res = await fetchWithRetry("/api/v3/exchangeInfo");
    const json = await res.json();
    const allowed =
      quote === "ALL"
        ? new Set(["USDT", "USDC", "BUSD"])
        : new Set([quote]);

    return (json.symbols || [])
      .filter(
        (s: any) =>
          s.status === "TRADING" &&
          (s.isSpotTradingAllowed ?? true) &&
          allowed.has(s.quoteAsset)
      )
      .map((s: any) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
  });
}

/**
 * Klines для символу/інтервалу.
 * Повертаємо у зручному форматі; кеш 60с (регулюєш TTL тут).
 */
export async function getKlines(
  symbol: string,
  interval: string,
  limit = 500
): Promise<
  {
    openTime: number;
    closeTime: number;
    time: number; // = openTime (ms)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[]
> {
  const key = `klines:${symbol}:${interval}:${limit}`;
  return memo(key, 60_000, async () => {
    const res = await fetchWithRetry(
      `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const arr = await res.json();
    return arr.map((k: any[]) => ({
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

/**
 * 24h тикер для одного символу.
 * Потрібний для /summary, щоб порахувати % зміни.
 * TTL — 30с (можеш збільшити/зменшити).
 */
export async function get24hTicker(symbol: string): Promise<{
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
}> {
  const key = `ticker24h:${symbol}`;
  return memo(key, 30_000, async () => {
    const res = await fetchWithRetry(
      `/api/v3/ticker/24hr?symbol=${symbol}`
    );
    const j = await res.json();
    return {
      symbol: j.symbol,
      lastPrice: +j.lastPrice,
      priceChangePercent: +j.priceChangePercent,
    };
  });
}