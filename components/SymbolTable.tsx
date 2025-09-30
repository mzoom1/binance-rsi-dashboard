'use client';
import { useMemo } from 'react';

type Row = { symbol: string; price: number; rsi: number | null; change24h: number };

export default function SymbolTable({ rows }: { rows?: Row[] }) {
  const data: Row[] = useMemo(() => Array.isArray(rows) ? rows : [], [rows]);

  return (
    <div className="overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900/50 sticky top-0">
          <tr className="text-left">
            <th className="px-3 py-2 w-40">Symbol</th>
            <th className="px-3 py-2 w-32">Price</th>
            <th className="px-3 py-2 w-32">RSI(14)</th>
            <th className="px-3 py-2 w-28">24h %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.symbol} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="px-3 py-2 font-medium">{r.symbol}</td>
              <td className="px-3 py-2">{r.price?.toFixed?.(4) ?? '—'}</td>
              <td className="px-3 py-2">{r.rsi != null ? r.rsi.toFixed(2) : '—'}</td>
              <td className="px-3 py-2">{isFinite(r.change24h) ? r.change24h.toFixed(2) + '%' : '—'}</td>
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
