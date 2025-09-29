// lib/prewarm-timer.ts
import { listSpotSymbols, getKlines } from "@/lib/binance";
import { intervals } from "@/lib/intervals";

declare global {
  // eslint-disable-next-line no-var
  var __PREWARM_STARTED__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __PREWARM_TIMER__: ReturnType<typeof setInterval> | undefined;
}

const IS_VERCEL = !!process.env.VERCEL;
// на локалці true (за замовч.), на Vercel — false
const ENABLED = !IS_VERCEL && (process.env.PREWARM_ENABLE ?? "true") === "true";
const INTERVAL_MS = Number(process.env.PREWARM_INTERVAL_MS ?? 30000);
const TOP = Number(process.env.PREWARM_TOP ?? 20);
const LIMIT = Number(process.env.PREWARM_LIMIT ?? 200);

async function prewarmOnce() {
  try {
    const syms = await listSpotSymbols("USDT");
    const top = syms.slice(0, TOP);
    const CONC = 12;
    for (const iv of intervals) {
      let i = 0;
      await Promise.all(
        Array.from({ length: Math.min(CONC, top.length) }).map(async () => {
          while (i < top.length) {
            const s = top[i++];
            try { await getKlines(s.symbol, iv as any, LIMIT); } catch {}
          }
        })
      );
    }
    console.log(`✅ prewarm: ${top.length} × ${intervals.length}`);
  } catch (e) {
    console.error("❌ prewarm error:", e);
  }
}

if (ENABLED && !globalThis.__PREWARM_STARTED__) {
  globalThis.__PREWARM_STARTED__ = true;
  prewarmOnce();
  globalThis.__PREWARM_TIMER__ = setInterval(prewarmOnce, INTERVAL_MS);
  console.log(`▶️ prewarm timer started (local)`);
}