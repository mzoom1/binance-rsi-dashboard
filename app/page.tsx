'use client';
import { useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Controls from '@/components/Controls';
import SymbolTable, { type RowMulti, type SortKey, type SortDir } from '@/components/SymbolTable';

type Market = 'spot' | 'futures';
type SummaryRow = { symbol: string; price: number | null; rsi: number | null; change24h: number | null };
type SummaryResp = { rows: SummaryRow[]; total: number; nextOffset: number | null; meta: any };

const qc = new QueryClient();

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <HomeClient />
    </QueryClientProvider>
  );
}

function HomeClient() {
  const [market, setMarket] = useState<Market>('spot');
  const [selectedIntervals, setSelected] = useState<string[]>(['5m','15m','1h','4h']);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>({ under30: false, over70: false });

  const [rows, setRows] = useState<RowMulti[]>([]);
  const [status, setStatus] = useState('Готово');

  // сортування: ключ може бути 'symbol'|'price'|'change24h' або 'rsi:<iv>'
  const [sortKey, setSortKey] = useState<SortKey>('rsi:5m');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // якщо прибрали інтервал, за яким сортуємо — перемикаємося на перший наявний
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
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'symbol' ? 'asc' : 'desc');
    }
  };

  async function fetchSummary(interval: string): Promise<SummaryRow[]> {
    const pageSize = 200;
    let offset = 0;
    let page = 1;
    let all: SummaryRow[] = [];
    for (;;) {
      setStatus(`Завантаження ${interval}, стор. ${page}… (${market})`);
      const url = `/api/summary?market=${market}&interval=${interval}&offset=${offset}&limit=${pageSize}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const json: SummaryResp = await res.json();
      const chunk = Array.isArray(json?.rows) ? json.rows : [];
      all = all.concat(chunk);
      if (json.nextOffset == null) break;
      offset = json.nextOffset;
      page++;
      await new Promise((r) => setTimeout(r, 120));
    }
    return all;
  }

  async function loadAll() {
    try {
      setRows([]);
      if (selectedIntervals.length === 0) return;
      setStatus('Старт паралельного завантаження…');
      const results = await Promise.all(selectedIntervals.map(iv => fetchSummary(iv)));
      const map = new Map<string, RowMulti>();
      for (let i = 0; i < selectedIntervals.length; i++) {
        const iv = selectedIntervals[i];
        for (const r of results[i]) {
          const prev = map.get(r.symbol);
          if (!prev) {
            map.set(r.symbol, {
              symbol: r.symbol,
              price: r.price,
              change24h: r.change24h,
              rsiByIv: { [iv]: r.rsi }
            });
          } else {
            if (prev.price == null && r.price != null) prev.price = r.price;
            if (prev.change24h == null && r.change24h != null) prev.change24h = r.change24h;
            prev.rsiByIv[iv] = r.rsi;
          }
        }
      }
      setRows(Array.from(map.values()));
      setStatus('Готово');
    } catch (e: any) {
      setStatus('Помилка: ' + String(e?.message || e));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, JSON.stringify(selectedIntervals)]);

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
        onRefresh={loadAll}
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
