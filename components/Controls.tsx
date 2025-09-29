'use client';
import { Button, Input } from './Ui';

export default function Controls({
  interval, setInterval,
  search, setSearch,
  filters, setFilters,
  onRefresh,
}: {
  interval: string;
  setInterval: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filters: { under30: boolean; over70: boolean };
  setFilters: (f: { under30: boolean; over70: boolean }) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border bg-transparent px-2 py-1.5 text-sm"
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
      >
        {['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'].map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <Input placeholder="Пошук символу (BTCUSDT)" value={search} onChange={e=>setSearch(e.target.value)} />

      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={filters.under30} onChange={e=>setFilters({...filters, under30: e.target.checked})} />
        RSI &lt; 30
      </label>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={filters.over70} onChange={e=>setFilters({...filters, over70: e.target.checked})} />
        RSI &gt; 70
      </label>

      <Button onClick={onRefresh}>Оновити</Button>
    </div>
  );
}
