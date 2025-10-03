'use client';
import { useMemo, useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { PersistQueryClientProvider, queryClient, persister } from '@/lib/reactQuery';
import Controls from '@/components/Controls';
import SymbolTable, { type RowMulti, type SortKey, type SortDir } from '@/components/SymbolTable';
import { sortIntervals } from '@/lib/intervals';
import Header from '@/components/Header';
import Sidebar, { type Category } from '@/components/Sidebar';
import CoinModal from '@/components/CoinModal';

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
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('spot');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const [status, setStatus] = useState('Готово');

  // Sorting
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

  // Watchlist: load and persist (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('watchlist');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setWatchlist(arr.map((s)=>String(s).toUpperCase()));
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('watchlist', JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  // Category -> market
  useEffect(() => {
    if (category === 'spot' && market !== 'spot') setMarket('spot');
    if (category === 'futures' && market !== 'futures') setMarket('futures');
  }, [category, market]);

  // Fetch summary per interval
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

  const queries = useQueries({
    queries: orderedTFs.map(iv => ({
      queryKey: ['summary', market, iv],
      queryFn: () => fetchSummaryAllPages(iv),
      placeholderData: (prev: SummaryResp | undefined) => prev,
      staleTime: 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  });

  // Loading status
  useEffect(() => {
    const anyLoading = queries.some(q => q.isLoading || q.isFetching);
    setStatus(anyLoading ? 'Завантаження…' : 'Готово');
  }, [queries]);

  // Merge per symbol across intervals
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

  // Text filter + RSI filters
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    const mainIv = selectedIntervals[0] ?? '5m';
    return (rows || [])
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? ((r.rsiByIv[mainIv] ?? 50) < 30) : true))
      .filter(r => (filters.over70 ? ((r.rsiByIv[mainIv] ?? 50) > 70) : true));
  }, [rows, search, filters, selectedIntervals]);

  // Sorting
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

  const mainIv = selectedIntervals[0] ?? '1h';

  return (
    <div className="space-y-4">
      <Header search={search} setSearch={setSearch} />
      <div className="text-sm opacity-70 -mt-2">{status}</div>

      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar
          category={category}
          onCategoryChange={(c)=>{ setCategory(c); queries.forEach(q=>q.refetch()); }}
          watchlist={watchlist}
          setWatchlist={(wl)=> setWatchlist(wl.map(s=>s.toUpperCase()))}
        />

        <div className="flex-1 space-y-4">
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
            onRowClick={(sym)=> setSelectedSymbol(sym)}
            category={category}
            watchlist={watchlist}
          />
        </div>
      </div>

function HomeClient() {
  const [market, setMarket] = useState<Market>('spot');
  const [selectedIntervals, setSelected] = useState<string[]>(sortIntervals(['5m','15m','1h','4h']));
  const orderedTFs = useMemo(() => sortIntervals(selectedIntervals), [selectedIntervals]);
  const setSelectedSorted = (next: string[]) => setSelected(sortIntervals(next));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>({ under30: false, over70: false });
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('spot');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [alertSymbol, setAlertSymbol] = useState<string | null>(null);

  const [status, setStatus] = useState('Готово');

  // Sorting
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

  // Load watchlist from localStorage (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('watchlist');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setWatchlist(arr.map((s)=>String(s).toUpperCase()));
      }
    } catch {}
  }, []);
  // Persist watchlist
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('watchlist', JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  // Market from category (Spot/Futures cause refetch)
  useEffect(() => {
    if (category === 'spot' && market !== 'spot') setMarket('spot');
    if (category === 'futures' && market !== 'futures') setMarket('futures');
  }, [category, market]);

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

  // per-interval queries
  const queries = useQueries({
    queries: orderedTFs.map(iv => ({
      queryKey: ['summary', market, iv],
      queryFn: () => fetchSummaryAllPages(iv),
      placeholderData: (prev: SummaryResp | undefined) => prev,
      staleTime: 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  });

  // Status
  useEffect(() => {
    const anyLoading = queries.some(q => q.isLoading || q.isFetching);
    setStatus(anyLoading ? 'Завантаження…' : 'Готово');
  }, [queries]);

  // Merge by symbol
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

  // Search and basic filters
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    const mainIv = selectedIntervals[0] ?? '5m';
    return (rows || [])
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? ((r.rsiByIv[mainIv] ?? 50) < 30) : true))
      .filter(r => (filters.over70 ? ((r.rsiByIv[mainIv] ?? 50) > 70) : true));
  }, [rows, search, filters, selectedIntervals]);

  // Sort
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

  const mainIv = selectedIntervals[0] ?? '1h';

  return (
    <div className="space-y-4">
      <Header search={search} setSearch={setSearch} />
      <div className="text-sm opacity-70 -mt-2">{status}</div>

      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar
          category={category}
          onCategoryChange={(c)=>{ setCategory(c); queries.forEach(q=>q.refetch()); }}
          watchlist={watchlist}
          setWatchlist={(wl)=> setWatchlist(wl.map(s=>s.toUpperCase()))}
        />

        <div className="flex-1 space-y-4">
          <Controls
            market={market} setMarket={setMarket}
            selected={selectedIntervals} setSelected={setSelectedSorted}
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
            onRowClick={(sym)=> setSelectedSymbol(sym)}
            category={category}
            watchlist={watchlist}
          />
        </div>
      </div>

      <CoinModal open={!!selectedSymbol} onClose={()=>setSelectedSymbol(null)} symbol={selectedSymbol} interval={mainIv} />
    </div>
  );
}
const setSelectedSorted = (next: string[]) => setSelected(sortIntervals(next));
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>({ under30: false, over70: false });
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('spot');
  const [alertSymbol, setAlertSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('watchlist');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setWatchlist(arr.map((s)=>String(s).toUpperCase()));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('watchlist', JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  useEffect(() => {
    if (category === 'spot' && market !== 'spot') setMarket('spot');
    if (category === 'futures' && market !== 'futures') setMarket('futures');
  }, [category, market]);

  // сортування: 'symbol' | 'price' | 'change24h' | 'rsi:<interval>'
  const [sortKey, setSortKey] = useState<SortKey>('rsi:5m');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  useEffect(() => {
{{ ... }}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            rsiColumns={selectedIntervals}
            onRowClick={(sym)=> setSelectedSymbol(sym)}
            onAlertClick={(sym)=> setAlertSymbol(sym)}
            category={category}
            watchlist={watchlist}
          />
<div>
      </div>

      <CoinModal open={!!selectedSymbol} onClose={()=>setSelectedSymbol(null)} symbol={selectedSymbol} interval={mainIv} />
      <AlertModal open={!!alertSymbol} onClose={()=>setAlertSymbol(null)} symbol={alertSymbol} interval={mainIv} />
    </div>
  );
{{ ... }}
