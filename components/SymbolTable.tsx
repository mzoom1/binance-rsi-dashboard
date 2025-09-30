'use client';

export type RowMulti = {
  symbol: string;
  price: number | null;
  change24h: number | null;
  rsiByIv: Record<string, number | null>; // RSI по інтервалах
};

export type SortKey = 'symbol' | 'price' | 'change24h' | 'rsi'; // rsi = по головному інтервалу
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
    <th className="px-3 py-2 w-[160px] cursor-pointer select-none" onClick={onClick}>
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
  mainIv,
}: {
  rows: RowMulti[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  rsiColumns: string[];   // які інтервали показуємо як колонки
  mainIv: string;         // головний для сортування
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
          <tr className="text-left">
            <Header label="Symbol" active={sortKey==='symbol'} dir={sortDir} onClick={()=>onSort('symbol')}/>
            <Header label="Price" active={sortKey==='price'} dir={sortDir} onClick={()=>onSort('price')}/>
            {rsiColumns.map(iv => (
              <th key={iv} className="px-3 py-2 w-[120px]">
                RSI({iv})
              </th>
            ))}
            <Header label="24h %" active={sortKey==='change24h'} dir={sortDir} onClick={()=>onSort('change24h')}/>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="px-3 py-2 font-medium">{r.symbol}</td>
              <td className="px-3 py-2">{r.price?.toFixed?.(4) ?? '—'}</td>
              {rsiColumns.map(iv => (
                <td key={iv} className="px-3 py-2">
                  {r.rsiByIv[iv] != null ? (r.rsiByIv[iv] as number).toFixed(2) : '—'}
                </td>
              ))}
              <td className="px-3 py-2">
                {Number.isFinite(r.change24h as number) ? (r.change24h as number).toFixed(2) + '%' : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center opacity-60" colSpan={2 + rsiColumns.length + 1}>
                Немає даних. Спробуйте оновити або змінити інтервал.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
