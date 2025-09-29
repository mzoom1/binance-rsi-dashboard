'use client';
import { useEffect, useRef } from 'react';
import { createChart, LineData, Time } from 'lightweight-charts';

type Props = { data: { time: number; rsi: number | null }[] };

export default function RsiChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, { height: 200 });
    const series = chart.addLineSeries();

    const linedata: LineData[] = data
      .filter(d => d.rsi != null)
      .map(d => ({
        time: Math.floor(d.time / 1000) as Time, // <— тут
        value: d.rsi as number,
      }));

    series.setData(linedata);

    series.createPriceLine({ price: 30, color: '#3b82f6', lineWidth: 1, lineStyle: 2 });
    series.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2 });

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