"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { Button } from "@/components/Ui";
import KlineChart from "@/components/KlineChart";
import RsiChart from "@/components/RsiChart";

export default function CoinModal({
  open,
  onClose,
  symbol,
  interval,
}: {
  open: boolean;
  onClose: () => void;
  symbol: string | null;
  interval: string;
}) {
  const [kl, setKl] = useState<any[] | null>(null);
  const [rsx, setRsx] = useState<any[] | null>(null);

  useEffect(() => {
    if (!open || !symbol) return;
    let alive = true;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=200`, { cache: "no-store" }),
          fetch(`/api/rsx?symbol=${symbol}&interval=${interval}&limit=200`, { cache: "no-store" }),
        ]);
        const ka = await a.json();
        const rb = await b.json();
        if (!alive) return;
        setKl(ka);
        setRsx(rb);
      } catch {
        if (alive) { setKl([]); setRsx([]); }
      }
    })();
    return () => { alive = false; };
  }, [open, symbol, interval]);

  const kldata = useMemo(() => (kl || []).map((k:any)=>({ time:k.time, open:k.open, high:k.high, low:k.low, close:k.close })), [kl]);
  const rsidata = useMemo(() => (rsx || []).map((r:any)=>({ time:r.time, rsi:r.rsi })), [rsx]);

  // Compute simple RSI crossings for 30/70
  const crossings = useMemo(() => {
    const out: { time: number; level: 30 | 70; dir: "up" | "down" }[] = [];
    let prev = rsx?.[0]?.rsi ?? null;
    for (let i=1; i < (rsx?.length || 0); i++) {
      const cur = rsx![i].rsi as number | null;
      const t = rsx![i].time as number;
      if (prev != null && cur != null) {
        if (prev < 30 && cur >= 30) out.push({ time: t, level: 30, dir: "up" });
        if (prev > 70 && cur <= 70) out.push({ time: t, level: 70, dir: "down" });
      }
      prev = cur;
    }
    return out.reverse().slice(0, 10);
  }, [rsx]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{symbol} • {interval}</div>
          <div className="flex items-center gap-2">
            <Button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">Set Alert</Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-sm font-medium mb-2">Candlesticks</div>
            <KlineChart data={kldata} />
          </div>
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-sm font-medium mb-2">RSI</div>
            <RsiChart data={rsidata} />
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">RSI crossings (30/70)</div>
              <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                {crossings.map((c, i) => (
                  <li key={i} className="flex justify-between text-xs opacity-80">
                    <span>{new Date(c.time).toLocaleString()}</span>
                    <span>{c.dir === 'up' ? '↑' : '↓'} {c.level}</span>
                  </li>
                ))}
                {crossings.length===0 && <li className="text-xs opacity-60">No recent crossings</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
