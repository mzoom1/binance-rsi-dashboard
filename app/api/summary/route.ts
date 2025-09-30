export const preferredRegion = ['fra1','cdg1','arn1'];
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { listSpotSymbols, getKlines } from "@/lib/binance";
import { intervals } from "@/lib/intervals";

// GET /api/prewarm
export async function GET() {
  try {
    // твоя логіка тут
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}