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
  onAlertClick,
}: {
  rows: RowMulti[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  rsiColumns: string[];
  onRowClick?: (symbol: string) => void;
  onAlertClick?: (symbol: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm max-h-[70vh]">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50 sticky top-0 z-10">
          <tr className="text-left">
            <SortHeader label="Symbol" active={sortKey==='symbol'} dir={sortDir} onClick={()=>onSort('symbol')} />
            <SortHeader label="Price" active={sortKey==='price'} dir={sortDir} onClick={()=>onSort('price')} />
            <th className="px-3 py-2 w-[120px]">RSI spark</th>
            {rsiColumns.map(iv => (
              <th key={iv} className={`px-3 py-2 w-[120px] cursor-pointer select-none ${iv==='4h' ? 'hidden sm:table-cell' : ''}`}
                  onClick={()=>onSort(`rsi:${iv}` as SortKey)}>
                <span className="inline-flex items-center gap-1">
                  {`RSI(${iv})`}
                  <span className={`${sortKey===`rsi:${iv}` ? 'text-black dark:text-white' : 'text-neutral-400'} text-xs`}>
                    {sortKey===`rsi:${iv}` ? (sortDir==='asc'?'▲':'▼') : '▼'}
                  </span>
                </span>
              </th>
            ))}
            <th className="px-3 py-2 w-[100px] cursor-pointer select-none hidden sm:table-cell" onClick={()=>onSort('change24h')}>
              <span className="inline-flex items-center gap-1">
                24h %
                <span className={`${sortKey==='change24h' ? 'text-black dark:text-white' : 'text-neutral-400'} text-xs`}>
                  {sortDir==='asc'?'▲':'▼'}
                </span>
              </span>
            </th>
            <th className="px-3 py-2 w-[48px] text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mainIv = rsiColumns[0];
            return (
              <tr
                key={r.symbol}
                className="group border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer"
                onClick={()=> onRowClick?.(r.symbol)}
              >
                <td className="px-3 py-2 font-medium">{r.symbol}</td>
                <td className="px-3 py-2">{r.price?.toFixed?.(4) ?? '—'}</td>
                <td className="px-3 py-2"><Sparkline symbol={r.symbol} interval={mainIv || '1h'} /></td>
                {rsiColumns.map(iv => {
                  const val = r.rsiByIv[iv];
                  // Gradient intensity: interpolate opacity based on distance from 50; color buckets by zones
                  let color = '#60a5fa';
                  if (typeof val === 'number') {
                    if (val < 30) color = '#4ade80';
                    else if (val > 70) color = '#f87171';
                  }
                  const intensity = typeof val === 'number' ? Math.min(1, 0.6 + Math.abs(val - 50) / 50 * 0.4) : 1;
                  return (
                    <td key={iv} className={`px-3 py-2 ${iv==='4h' ? 'hidden sm:table-cell' : ''}`}>
                      {val != null ? <span style={{ color, opacity: intensity }}>{(val as number).toFixed(2)}</span> : '—'}
                    </td>
                  );
                })}
                <td className="px-3 py-2 hidden sm:table-cell">
                  {Number.isFinite(r.change24h as number) ? (
                    <span className={(r.change24h as number) >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {(r.change24h as number).toFixed(2)}%
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e)=>{ e.stopPropagation(); onAlertClick?.(r.symbol); }}
                    title="Set Alert"
                  >
                    🔔
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center opacity-60" colSpan={4 + rsiColumns.length + 1}>
                Немає даних. Спробуйте оновити або змінити інтервал.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
