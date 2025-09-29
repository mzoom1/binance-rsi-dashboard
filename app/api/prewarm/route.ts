export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { listSpotSymbols, getKlines } from "@/lib/binance";
import { intervals } from "@/lib/intervals";

export const runtime = "nodejs";

// GET /api/prewarm
export async function GET() {
  try {
    const syms = await listSpotSymbols("USDT");
    const top = syms.slice(0, 20); // для тесту тільки 20 символів

    for (const iv of intervals) {
      await Promise.all(
        top.map(s => getKlines(s.symbol, iv as any, 200).catch(() => null))
      );
    }

    return NextResponse.json({
      status: "ok",
      symbols: top.length,
      intervals: intervals.length,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "failed", { status: 500 });
  }
}
