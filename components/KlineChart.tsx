'use client';
import { useEffect, useRef } from 'react';
import { createChart, CandlestickData, Time } from 'lightweight-charts';

type Props = {
  data: { time: number; open: number; high: number; low: number; close: number }[];
};

export default function KlineChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, { height: 320 });
    const series = chart.addCandlestickSeries();

    const formatted: CandlestickData[] = data.map(d => ({
      time: Math.floor(d.time / 1000) as Time, // <— тут
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    series.setData(formatted);

    const ro = new ResizeObserver(() =>
      chart.applyOptions({ width: ref.current!.clientWidth })
    );
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data]);

  return <div ref={ref} className="w-full" />;
}