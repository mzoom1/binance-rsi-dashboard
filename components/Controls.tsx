'use client';
import React, { Dispatch, SetStateAction } from 'react';

const intervals = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'] as const;
export type Market = 'spot' | 'futures';

type ControlsProps = {
  interval: string;
  setInterval: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filters: { under30: boolean; over70: boolean };
  setFilters: Dispatch<SetStateAction<{ under30: boolean; over70: boolean }>>;
  onRefresh: () => void;
  market: Market;
  setMarket: Dispatch<SetStateAction<Market>>;
};

export default function Controls({
  interval,
  setInterval,
  search,
  setSearch,
  filters,
  setFilters,
  onRefresh,
  market,
  setMarket,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        className="rounded-md border px-2 py-1"
      >
        {intervals.map((iv) => (
          <option key={iv} value={iv}>{iv}</option>
        ))}
      </select>

      <select
        value={market}
        onChange={(e) => setMarket(e.target.value as Market)}
        className="rounded-md border px-2 py-1"
      >
        <option value="spot">Spot</option>
        <option value="futures">Futures</option>
      </select>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Пошук символу (BTCUSDT)"
        className="min-w-[220px] rounded-md border px-3 py-1"
      />

      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={filters.under30}
          onChange={(e) => setFilters((f) => ({ ...f, under30: e.target.checked }))}
        />
        RSI &lt; 30
      </label>

      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={filters.over70}
          onChange={(e) => setFilters((f) => ({ ...f, over70: e.target.checked }))}
        />
        RSI &gt; 70
      </label>

      <button onClick={onRefresh} className="rounded-md border px-3 py-1">
        Оновити
      </button>
    </div>
  );
}
