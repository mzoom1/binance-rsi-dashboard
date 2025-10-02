"use client";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ symbol, interval = "1h" }: { symbol: string; interval?: string }) {
  const [data, setData] = useState<{ time: number; rsi: number | null }[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/rsx?symbol=${symbol}&interval=${interval}&limit=60`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!alive) return;
        setData(json);
      } catch (e) {
        if (alive) setData([]);
      }
    })();
    return () => { alive = false; };
  }, [symbol, interval]);

  const cleaned = useMemo(() => (data || []).map((d) => ({ r: d.rsi ?? undefined })), [data]);

  return (
    <div className="h-8 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 3, bottom: 0, left: 0, right: 0 }}>
          <Line type="monotone" dataKey="r" stroke="#60a5fa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
