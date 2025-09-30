'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import KlineChart from '@/components/KlineChart';
import RsiChart from '@/components/RsiChart';

const qc = new QueryClient();

export default function SymbolPage({ params }: { params: { symbol: string } }) {
  return (
    <QueryClientProvider client={qc}>
      <SymbolClient symbol={params.symbol.toUpperCase()} />
    </QueryClientProvider>
  );
}

function SymbolClient({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState('1h');
  const [period, setPeriod] = useState(14);

  const { data, error } = useQuery({
    queryKey: ['rsx', symbol, interval, period],
    queryFn: async () => {
      const res = await fetch(`/api/rsx?symbol=${symbol}&interval=${interval}&limit=500&period=${period}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Array<{ time:number; close:number; rsi:number|null }>>;
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{symbol}</h2>
          <p className="text-sm opacity-70">Інтервал {interval}, RSI період {period}</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border bg-transparent px-2 py-1" value={interval} onChange={e=>setInterval(e.target.value)}>
            {['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'].map(v=>
              <option key={v} value={v}>{v}</option>
            )}
          </select>
          <select className="rounded-md border bg-transparent px-2 py-1" value={period} onChange={e=>setPeriod(Number(e.target.value))}>
            {[7,14,21].map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded border border-red-500 p-3">Помилка: {(error as Error).message}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        <div className="rounded-xl border p-3">
          <KlineChart data={data?.map(d=>({ time: Math.floor(d.time/1000), open: d.close, high: d.close, low: d.close, close: d.close })) ?? []} />
        </div>
        <div className="rounded-xl border p-3">
          <RsiChart data={data ?? []} />
        </div>
      </div>
    </div>
  );
}
