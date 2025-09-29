import { listSpotSymbols, getKlines } from "@/lib/binance";
import { intervals } from "@/lib/intervals";

// Щоб у dev не запускалось кілька разів при HMR
declare global {
  // eslint-disable-next-line no-var
  var __PREWARM_STARTED__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __PREWARM_TIMER__: ReturnType<typeof setInterval> | undefined;
}

const ENABLED = (process.env.PREWARM_ENABLE ?? "true") === "true";
const INTERVAL_MS = Number(process.env.PREWARM_INTERVAL_MS ?? 30000); // 30s
const TOP = Number(process.env.PREWARM_TOP ?? 20); // скільки символів прогрівати
const LIMIT = Number(process.env.PREWARM_LIMIT ?? 200); // скільки свічок тягнути на інтервал

async function prewarmOnce() {
  try {
    const syms = await listSpotSymbols("USDT");
    const top = syms.slice(0, TOP);

    // обмежимо паралельність, щоб не впертись у rate-limit
    const CONCURRENCY = 12;
    for (const iv of intervals) {
      let i = 0;
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, top.length) }).map(async () => {
          while (i < top.length) {
            const idx = i++;
            const s = top[idx];
            try { await getKlines(s.symbol, iv as any, LIMIT); } catch {}
          }
        })
      );
    }
    console.log(`✅ prewarm: ${top.length} symbols × ${intervals.length} intervals @ ${new Date().toISOString()}`);
  } catch (e) {
    console.error("❌ prewarm error:", e);
  }
}

// запускати лише один раз на процес
if (ENABLED && !globalThis.__PREWARM_STARTED__) {
  globalThis.__PREWARM_STARTED__ = true;
  prewarmOnce();
  globalThis.__PREWARM_TIMER__ = setInterval(prewarmOnce, INTERVAL_MS);
  console.log(`▶️ prewarm timer started: every ${INTERVAL_MS}ms, TOP=${TOP}, LIMIT=${LIMIT}`);
}
