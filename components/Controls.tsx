'use client';
import { Dispatch, SetStateAction } from 'react';
 import { intervals, toggleInterval } from '@/lib/intervals';

type Market = 'spot' | 'futures';

export default function Controls({
  market, setMarket,
  selected, setSelected,
  search, setSearch,
  filters, setFilters,
  onRefresh,
}: {
  market: Market;
  setMarket: Dispatch<SetStateAction<Market>>;
  selected: string[]; // обрані інтервали (до 4)
  setSelected: Dispatch<SetStateAction<string[]>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filters: { under30: boolean; over70: boolean };
  setFilters: Dispatch<SetStateAction<{ under30: boolean; over70: boolean }>>;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Market */}
      <select
        className="px-2 py-1 border rounded-md"
        value={market}
        onChange={(e)=>setMarket(e.target.value as Market)}
        title="Ринок"
      >
        <option value="spot">Spot</option>
        <option value="futures">Futures</option>
      </select>

      {/* Multi-interval chips */}
      <div className="flex flex-wrap gap-2">
        {intervals.map(iv => {
          const active = selected.includes(iv);
          return (
            <button
              key={iv}
              type="button"
              onClick={()=>setSelected(prev => toggleInterval(prev, iv))}
              className={`px-2 py-1 rounded text-sm border ${
                active ? 'bg-neutral-900 text-white border-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Натисніть, щоб додати/прибрати у вибір (до 4)"
            >
              {iv}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        placeholder="Пошук символу (BTCUSDT)…"
        className="px-3 py-1 border rounded-md min-w-[220px]"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />

      {/* Filters */}
      <label className="inline-flex items-center gap-1">
        <input type="checkbox" checked={filters.under30} onChange={(e)=>setFilters(s=>({...s, under30:e.target.checked}))}/>
        <span>RSI &lt; 30</span>
      </label>
      <label className="inline-flex items-center gap-1">
        <input type="checkbox" checked={filters.over70} onChange={(e)=>setFilters(s=>({...s, over70:e.target.checked}))}/>
        <span>RSI &gt; 70</span>
      </label>

      <button className="px-3 py-1 border rounded-md" onClick={onRefresh}>Оновити</button>
    </div>
  );
}
