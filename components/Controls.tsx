'use client';

import { Dispatch, SetStateAction } from 'react';
import { intervals, sortIntervals } from '@/lib/intervals';

type Market = 'spot' | 'futures';
type Filters = { oversold: boolean; overbought: boolean };

type Props = {
  market: Market;
  setMarket: Dispatch<SetStateAction<Market>>;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  onRefresh: () => void;
};

export default function Controls({
  market, setMarket,
  selected, setSelected,
  search, setSearch,
  filters, setFilters,
  onRefresh,
}: Props) {

  const toggleIv = (iv: string) => {
    setSelected(prev => {
      const next = prev.includes(iv) ? prev.filter(x => x !== iv) : [...prev, iv];
      // гарантуємо впорядкування за шкалою 1m..1M і максимум 4 колонки
      return sortIntervals(next).slice(0, 4);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      {/* Маркет */}
      <select
        className="px-2 py-1 border rounded-md"
        value={market}
        onChange={e => setMarket(e.target.value as Market)}
      >
        <option value="spot">Spot</option>
        <option value="futures">Futures</option>
      </select>

      {/* Пошук */}
      <input
        className="px-3 py-1 border rounded-md min-w-[220px]"
        placeholder="Пошук символу (BTCUSDT)…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Фільтри */}
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.oversold}
          onChange={e => setFilters(f => ({ ...f, oversold: e.target.checked }))}
        />
        <span>RSI &lt; 30</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.overbought}
          onChange={e => setFilters(f => ({ ...f, overbought: e.target.checked }))}
        />
        <span>RSI &gt; 70</span>
      </label>

      {/* Вибір таймфреймів (впорядковано) */}
      <div className="flex items-center gap-1 flex-wrap">
        {intervals.map(iv => {
          const active = selected.includes(iv);
          return (
            <button
              key={iv}
              type="button"
              onClick={() => toggleIv(iv)}
              className={`px-2 py-1 rounded-md border text-sm ${active ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
              title={`Показати/сховати RSI для ${iv}`}
            >
              {iv}
            </button>
          );
        })}
      </div>

      <button className="px-3 py-1 border rounded-md" onClick={onRefresh}>
        Оновити
      </button>
    </div>
  );
}
