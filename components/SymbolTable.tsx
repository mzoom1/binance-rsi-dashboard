'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function SymbolTable({ rows }: { rows: Array<{symbol:string; price:number; rsi:number|null; change24h:number}> }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const items = rowVirtualizer.getVirtualItems();

  return (
    <div className="rounded-xl border">
      <div className="grid grid-cols-5 gap-2 border-b px-3 py-2 text-sm font-medium">
        <div>Symbol</div>
        <div className="text-right">Price</div>
        <div className="text-right">RSI(14)</div>
        <div className="text-right">24h %</div>
        <div></div>
      </div>
      <div ref={parentRef} className="max-h-[70vh] overflow-auto">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {items.map(vi => {
            const r = rows[vi.index];
            return (
              <div
                key={vi.key}
                className="grid grid-cols-5 gap-2 px-3 text-sm"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)`, height: vi.size }}
              >
                <div className="py-2 font-mono">{r.symbol}</div>
                <div className="py-2 text-right">{r.price?.toFixed(6)}</div>
                <div className={`py-2 text-right ${r.rsi!=null && (r.rsi<30?'text-blue-500': r.rsi>70? 'text-red-500':'')}`}>{r.rsi?.toFixed(2) ?? '—'}</div>
                <div className={`py-2 text-right ${r.change24h>0? 'text-emerald-600':'text-rose-600'}`}>{r.change24h.toFixed(2)}%</div>
                <div className="py-2 text-right">
                  <Link className="rounded border px-2 py-1" href={`/symbol/${r.symbol}`}>Chart</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
