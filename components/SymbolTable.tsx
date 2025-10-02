"use client";
import Sparkline from "@/components/Sparkline";

export type RowMulti = {
  symbol: string;
  price: number | null;
  change24h: number | null;
  rsiByIv: Record<string, number | null>;
};

export type SortKey = 'symbol' | 'price' | 'change24h' | `rsi:${string}`;
export type SortDir = 'asc' | 'desc';

function SortHeader({
  active,
  dir,
  label,
  onClick,
}: {
  active: boolean;
  dir: SortDir;
  label: string;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2 w-[140px] cursor-pointer select-none" onClick={onClick}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`${active ? 'text-black dark:text-white' : 'text-neutral-400'} text-xs`}>
          {dir === 'asc' ? '▲' : '▼'}
        </span>
      </span>
    </th>
  );
}

export default function SymbolTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  rsiColumns,
  onRowClick,
}: {
  rows: RowMulti[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  rsiColumns: string[];
  onRowClick?: (symbol: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
          <tr className="text-left">
            <SortHeader label="Symbol" active={sortKey==='symbol'} dir={sortDir} onClick={()=>onSort('symbol')} />
            <SortHeader label="Price" active={sortKey==='price'} dir={sortDir} onClick={()=>onSort('price')} />
            <th className="px-3 py-2 w-[120px]">RSI spark</th>
            {rsiColumns.map(iv => (
              <SortHeader
                key={iv}
                label={`RSI(${iv})`}
                active={sortKey===`rsi:${iv}`}
                dir={sortKey===`rsi:${iv}` ? sortDir : 'desc'}
                onClick={()=>onSort(`rsi:${iv}` as SortKey)}
              />
            ))}
            <SortHeader label="24h %" active={sortKey==='change24h'} dir={sortDir} onClick={()=>onSort('change24h')} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mainIv = rsiColumns[0];
            return (
              <tr
                key={r.symbol}
                className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer"
                onClick={()=> onRowClick?.(r.symbol)}
              >
                <td className="px-3 py-2 font-medium">{r.symbol}</td>
                <td className="px-3 py-2">{r.price?.toFixed?.(4) ?? '—'}</td>
                <td className="px-3 py-2"><Sparkline symbol={r.symbol} interval={mainIv || '1h'} /></td>
                {rsiColumns.map(iv => {
                  const val = r.rsiByIv[iv];
                  const color = val == null ? undefined : (val < 30 ? '#4ade80' : val > 70 ? '#f87171' : '#60a5fa');
                  return (
                    <td key={iv} className="px-3 py-2">
                      {val != null ? <span style={{ color }}>{(val as number).toFixed(2)}</span> : '—'}
                    </td>
                  );
                })}
                <td className="px-3 py-2">
                  {Number.isFinite(r.change24h as number) ? (r.change24h as number).toFixed(2) + '%' : '—'}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center opacity-60" colSpan={3 + rsiColumns.length + 1}>
                Немає даних. Спробуйте оновити або змінити інтервал.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
