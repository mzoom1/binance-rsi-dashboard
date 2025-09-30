'use client';
import { useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Controls from '@/components/Controls';
import SymbolTable from '@/components/SymbolTable';

type Row = { symbol: string; price: number | null; rsi: number | null; change24h: number | null };
type Resp = { rows: Row[]; total: number; nextOffset: number | null; meta: any };

const qc = new QueryClient();

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <HomeClient />
    </QueryClientProvider>
  );
}

function HomeClient() {
  const [interval, setInterval] = useState<string>('5m');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ under30: boolean; over70: boolean }>({ under30: false, over70: false });

  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('Готово');

  async function fetchAllPages() {
    try {
      setRows([]);
      setStatus('Завантаження…');
      const pageSize = 200;
      let offset = 0;
      let page = 1;
      let all: Row[] = [];

      for (;;) {
        setStatus(`Сторінка ${page}…`);
        const res = await fetch(`/api/summary?interval=${interval}&offset=${offset}&limit=${pageSize}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const json: Resp = await res.json();
        const chunk = Array.isArray(json?.rows) ? json.rows : [];
        all = all.concat(chunk);
        setRows(all);               // проміжне оновлення в UI
        if (json.nextOffset == null) break;
        offset = json.nextOffset;
        page++;
        await new Promise(r => setTimeout(r, 150)); // невелика пауза — поважаємо rate limits
      }
      setStatus('Готово');
    } catch (e: any) {
      setStatus('Помилка: ' + String(e?.message || e));
    }
  }

  useEffect(() => { fetchAllPages(); }, [interval]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return (rows || [])
      .filter(r => (q ? r.symbol.includes(q) : true))
      .filter(r => (filters.under30 ? (r.rsi ?? 50) < 30 : true))
      .filter(r => (filters.over70 ? (r.rsi ?? 50) > 70 : true));
  }, [rows, search, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Binance RSI Dashboard</h1>
        <span className="text-sm opacity-70">{status}</span>
      </div>
      <Controls
        interval={interval}
        setInterval={setInterval}
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        onRefresh={fetchAllPages}
      />
      <SymbolTable rows={filtered} />
    </div>
  );
}
