import { intervals, sortIntervals } from '@/lib/intervals';
'use client';
import { Dispatch, SetStateAction } from 'react';

export const intervals = [
  '1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'
];

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
  const toggleInterval = (iv: string) => {
    setSelected(prev => {
      const has = prev.includes(iv);
      if (has) return prev.filter(x => x !== iv);
      if (prev.length >= 4) return prev; // максимум 4
      return [...prev, iv];
    });
  };

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
              onClick={()=>toggleInterval(iv)}
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

// toggle для ввімкнення/вимкнення інтервалів
function toggle(iv: string) {
  setSelected(prev => {
    const next = prev.includes(iv)
      ? prev.filter(x => x !== iv)
      : [...prev, iv];
    return sortIntervals(next).slice(0, 4);
  });
}
