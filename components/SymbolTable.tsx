'use client';

export type Row = { symbol: string; price: number | null; rsi: number | null; change24h: number | null };

export default function SymbolTable({
  rows,
  sortDir,
  onToggleSort,
}: {
  rows: Row[];
  sortDir: 'asc' | 'desc';
  onToggleSort: () => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
          <tr className="text-left">
            <th className="px-3 py-2 w-[160px]">Symbol</th>
            <th className="px-3 py-2 w-[160px]">Price</th>
            <th className="px-3 py-2 w-[160px] cursor-pointer select-none" onClick={onToggleSort} title="Сортувати за RSI">
              <span className="inline-flex items-center gap-1">
                RSI(14)
                <span className="opacity-70">{sortDir === 'asc' ? '▲' : '▼'}</span>
              </span>
            </th>
            <th className="px-3 py-2 w-[120px]">24h %</th>
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
