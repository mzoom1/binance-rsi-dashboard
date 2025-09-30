'use client';

type Row = {
  symbol: string;
  price: number | null;
  rsi: number | null;
  change24h: number | null;
};

export default function SymbolTable({ rows }: { rows: Row[] }) {
  const data = Array.isArray(rows) ? rows : [];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr className="text-xs uppercase text-neutral-500">
            <th className="px-3 py-2">Symbol</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">RSI(14)</th>
            <th className="px-3 py-2">24h %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {data.map((r) => (
            <tr key={r.symbol} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
              <td className="px-3 py-2 font-medium">{r.symbol}</td>
              <td className="px-3 py-2">
                {Number.isFinite(r.price as number) ? (r.price as number).toFixed(4) : '—'}
              </td>
              <td className="px-3 py-2">
                {Number.isFinite(r.rsi as number) ? (r.rsi as number).toFixed(2) : '—'}
              </td>
              <td className="px-3 py-2">
                {Number.isFinite(r.change24h as number) ? ((r.change24h as number).toFixed(2) + '%') : '—'}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
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
