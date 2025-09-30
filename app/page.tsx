'use client';
import { useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Controls from '@/components/Controls';
import SymbolTable from '@/components/SymbolTable';

type Row = { symbol: string; price: number; rsi: number | null; change24h: number };
type SummaryResp = { rows: Row[]; total: number; nextOffset: number | null; meta: any };

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
  const [quote, setQuote] = useState<'USDT'|'USDC'|'BUSD'|'ALL'>('USDT');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>(
    { under30: false, over70: false }
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [loadingMsg, setLoadingMsg] = useState<string>('Готово');

  async function fetchAllPages() {
    try {
      setRows([]);
      setLoadingMsg('Завантаження…');
      const pageSize = 200;
      let offset = 0;
      let all: Row[] = [];
      let page = 1;

      for (;;) {
        setLoadingMsg(`Сторінка ${page}…`);
        const res = await fetch(`/api/summary?interval=${interval}&quote=${quote}&offset=${offset}&limit=${pageSize}`, { cache:'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const json: SummaryResp = await res.json();
        const chunk = Array.isArray(json?.rows) ? json.rows : [];
        all = all.concat(chunk);
        setRows(all); // проміжне оновлення в UI
        if (json.nextOffset == null) break;
        offset = json.nextOffset;
        page++;
        await new Promise(r => setTimeout(r, 150)); // маленький бреак, щоб поважати ліміти
      }

      setLoadingMsg('Готово');
    } catch (e:any) {
      setLoadingMsg('Помилка: ' + String(e?.message || e));
    }
  }

  // авто-фетч при зміні інтервалу/квот
  useEffect(() => { fetchAllPages(); }, [interval, quote]);

  const filtered = useMemo<Row[]>(() => {
    const list = Array.isArray(rows) ? rows : [];
    const q = search.trim().toUpperCase();
    return list
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? (r.rsi ?? 50) < 30 : true))
      .filter(r => (filters.over70 ? (r.rsi ?? 50) > 70 : true));
  }, [rows, search, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Binance RSI Dashboard</h1>
        <span className="text-sm opacity-70">{loadingMsg}</span>
      </div>
      <Controls
        interval={interval}
        setInterval={setInterval}
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        onRefresh={fetchAllPages}
        // невелика опція для Quote (замінимо селект у Controls якщо треба)
      />
      <SymbolTable rows={filtered} />
    </div>
  );
}
