'use client';
import { useMemo, useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { PersistQueryClientProvider, queryClient, persister } from '@/lib/reactQuery';
import Controls from '@/components/Controls';
import SymbolTable, { type RowMulti, type SortKey, type SortDir } from '@/components/SymbolTable';
 import { sortIntervals } from '@/lib/intervals';

type Market = 'spot' | 'futures';
type SummaryRow = { symbol: string; price: number | null; rsi: number | null; change24h: number | null };
type SummaryResp = { rows: SummaryRow[]; total: number; nextOffset: number | null; meta: any };

export default function Page() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 }}>
      <HomeClient />
    </PersistQueryClientProvider>
  );
}

function HomeClient() {
  const [market, setMarket] = useState<Market>('spot');
  const [selectedIntervals, setSelected] = useState<string[]>(sortIntervals(['5m','15m','1h','4h']));
  const orderedTFs = useMemo(() => sortIntervals(selectedIntervals), [selectedIntervals]);
const setSelectedSorted = (next: string[]) => setSelected(sortIntervals(next));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>({ under30: false, over70: false });

  const [status, setStatus] = useState('Готово');

  // сортування: 'symbol' | 'price' | 'change24h' | 'rsi:<interval>'
  const [sortKey, setSortKey] = useState<SortKey>('rsi:5m');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  useEffect(() => {
    if (sortKey.startsWith('rsi:')) {
      const iv = sortKey.slice(4);
      if (!selectedIntervals.includes(iv)) {
        const fallback = selectedIntervals[0] ?? '5m';
        setSortKey(('rsi:' + fallback) as SortKey);
      }
    }
  }, [selectedIntervals, sortKey]);
  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'symbol' ? 'asc' : 'desc'); }
  };

  // Фетчер сторінок для одного інтервалу (батчить сторінки, але сам запит кешується по інтервалу)
  async function fetchSummaryAllPages(interval: string): Promise<SummaryRow[]> {
    const pageSize = 200;
    let offset = 0;
    let all: SummaryRow[] = [];
    for (;;) {
      const url = `/api/summary?market=${market}&interval=${interval}&offset=${offset}&limit=${pageSize}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const json: SummaryResp = await res.json();
      all = all.concat(Array.isArray(json?.rows) ? json.rows : []);
      if (json.nextOffset == null) break;
      offset = json.nextOffset;
      await new Promise(r => setTimeout(r, 120));
    }
    return all;
  }

  // Кожен інтервал — окремий запит/кеш
  const queries = useQueries({
    queries: orderedTFs.map(iv => ({
      queryKey: ['summary', market, iv], // ключ НЕ змінюється при приховуванні — кеш стабільний
      queryFn: () => fetchSummaryAllPages(iv),
      placeholderData: (prev: SummaryResp | undefined) => prev,   // показати старі дані, поки оновлюємо
      staleTime: 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  });

  // Статус
  useEffect(() => {
    const anyLoading = queries.some(q => q.isLoading || q.isFetching);
    setStatus(anyLoading ? 'Завантаження…' : 'Готово');
  }, [queries]);

  // Мерджимо по символу
  const rows: RowMulti[] = useMemo(() => {
    const map = new Map<string, RowMulti>();
    for (let i = 0; i < selectedIntervals.length; i++) {
      const iv = selectedIntervals[i];
      const data = queries[i].data as SummaryRow[] | undefined;
      if (!data) continue;
      for (const r of data) {
        const prev = map.get(r.symbol);
        if (!prev) {
          map.set(r.symbol, {
            symbol: r.symbol,
            price: r.price,
            change24h: r.change24h,
            rsiByIv: { [iv]: r.rsi },
          });
        } else {
          if (prev.price == null && r.price != null) prev.price = r.price;
          if (prev.change24h == null && r.change24h != null) prev.change24h = r.change24h;
          prev.rsiByIv[iv] = r.rsi;
        }
      }
    }
    return Array.from(map.values());
  }, [queries, selectedIntervals]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    const mainIv = selectedIntervals[0] ?? '5m';
    return (rows || [])
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? ((r.rsiByIv[mainIv] ?? 50) < 30) : true))
      .filter(r => (filters.over70 ? ((r.rsiByIv[mainIv] ?? 50) > 70) : true));
  }, [rows, search, filters, selectedIntervals]);

  const ordered = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const numCmp = (a?: number | null, b?: number | null) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    };
    const arr = [...filtered];
    arr.sort((a,b)=>{
      if (sortKey === 'symbol')   return dir * a.symbol.localeCompare(b.symbol);
      if (sortKey === 'price')    return dir * numCmp(a.price, b.price);
      if (sortKey === 'change24h')return dir * numCmp(a.change24h, b.change24h);
      if (sortKey.startsWith('rsi:')) {
        const iv = sortKey.slice(4);
        return dir * numCmp(a.rsiByIv[iv], b.rsiByIv[iv]);
      }
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Binance RSI Dashboard</h1>
        <span className="text-sm opacity-70">{status}</span>
      </div>

      <Controls
        market={market} setMarket={setMarket}
        selected={selectedIntervals} setSelected={setSelected}
        search={search} setSearch={setSearch}
        filters={filters} setFilters={setFilters}
        onRefresh={() => queries.forEach(q => q.refetch())}
      />

      <SymbolTable
        rows={ordered}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        rsiColumns={selectedIntervals}
      />
    </div>
  );
}
