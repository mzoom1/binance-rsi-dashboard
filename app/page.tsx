'use client';
import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Controls from '@/components/Controls';
import SymbolTable from '@/components/SymbolTable';

type Row = { symbol: string; price: number; rsi: number | null; change24h: number };

const qc = new QueryClient();

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <HomeClient />
    </QueryClientProvider>
  );
}

function HomeClient() {
  const [interval, setInterval] = useState<string>('1h');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>(
    { under30: false, over70: false }
  );

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: ['summary', interval],
    queryFn: async () => {
      const res = await fetch(`/api/summary?interval=${interval}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Row[]>;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    const list: Row[] = data ?? [];
    const q = search.trim().toUpperCase();
    return list
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? (r.rsi ?? 50) < 30 : true))
      .filter(r => (filters.over70 ? (r.rsi ?? 50) > 70 : true));
  }, [data, search, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Binance RSI Dashboard</h1>
        <span className="text-sm opacity-70">{isFetching ? 'Оновлення…' : 'Готово'}</span>
      </div>
      <Controls
        interval={interval}
        setInterval={setInterval}
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => refetch()}
      />
      {error && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/10 dark:text-amber-200">
          Перевищено ліміт або помилка API: {(error as Error).message}
        </div>
      )}
      <SymbolTable rows={filtered} />
    </div>
  );
}
