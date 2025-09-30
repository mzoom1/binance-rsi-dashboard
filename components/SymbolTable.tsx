'use client';

export type Row = { symbol: string; price: number | null; rsi: number | null; change24h: number | null };
export type SortKey = 'symbol' | 'price' | 'rsi' | 'change24h';
export type SortDir = 'asc' | 'desc';

function Header({
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
    <th
      className="px-3 py-2 w-[160px] cursor-pointer select-none"
      onClick={onClick}
      title="Натисніть для сортування"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span
          className={`${
            active ? 'text-black dark:text-white' : 'text-neutral-400'
          } text-xs`}
        >
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
}: {
  rows: Row[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
          <tr className="text-left">
            <Header
              label="Symbol"
              active={sortKey === 'symbol'}
              dir={sortDir}
              onClick={() => onSort('symbol')}
            />
            <Header
              label="Price"
              active={sortKey === 'price'}
              dir={sortDir}
              onClick={() => onSort('price')}
            />
            <Header
              label="RSI(14)"
              active={sortKey === 'rsi'}
              dir={sortDir}
              onClick={() => onSort('rsi')}
            />
            <Header
              label="24h %"
              active={sortKey === 'change24h'}
              dir={sortDir}
              onClick={() => onSort('change24h')}
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="px-3 py-2 font-medium">{r.symbol}</td>
              <td className="px-3 py-2">{r.price?.toFixed?.(4) ?? '—'}</td>
              <td className="px-3 py-2">{r.rsi != null ? r.rsi.toFixed(2) : '—'}</td>
              <td className="px-3 py-2">
                {Number.isFinite(r.change24h as number) ? (r.change24h as number).toFixed(2) + '%' : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center opacity-60" colSpan={4}>
                Немає даних. Спробуйте оновити або змінити інтервал.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
